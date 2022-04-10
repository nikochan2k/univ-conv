import type { Readable } from "stream";
import {
  blobConverter,
  bufferConverter,
  readableConverter,
  uint8ArrayConverter,
} from "./converters";
import { AbstractConverter, ConvertOptions, Data, Options } from "./core";
import {
  closeStream,
  EMPTY_READABLE_STREAM,
  fileToReadable,
  handleReadable,
  handleReadableStream,
  hasStreamOnBlob,
  isBrowser,
  isNode,
  isReadableStream,
} from "./util";

function createReadableStream<T>(
  bufferSize: number,
  startEnd: { start: number; end: number | undefined },
  slice: (s: number, e: number) => T,
  getSize: (chunk: T) => number
) {
  const start = startEnd.start;
  const end = startEnd.end as number;
  let index = 0;
  return new ReadableStream<unknown>({
    start: (controller) => {
      do {
        let e = index + bufferSize;
        if (end < e) e = end;
        let chunk: T;
        if (index < start && start < e) {
          chunk = slice(start, e);
        } else if (start <= index) {
          chunk = slice(index, e);
        } else {
          continue;
        }
        controller.enqueue(chunk);
        index += getSize(chunk);
      } while (index < end);
      controller.close();
    },
  });
}

async function createReadableStreamOfReader(
  readable: Readable,
  options: ConvertOptions
) {
  const { start, end } = await readableConverter().getStartEnd(
    readable,
    options
  );
  const bufferSize = options.bufferSize;
  const converter = uint8ArrayConverter();
  let index = 0;
  return new ReadableStream({
    start: async (controller) => {
      await handleReadable(readable, async (chunk) => {
        const u8 = await converter.convert(chunk, { bufferSize });
        const size = u8.byteLength;
        let e = index + size;
        if (end != null && end < e) e = end;
        if (index < start && start < e) {
          controller.enqueue(u8.slice(start, e));
        } else if (start <= index) {
          controller.enqueue(u8);
        }
        index += size;
        return end == null || index < end;
      });
    },
    cancel: (err) => {
      readable.destroy(err as Error);
      readable.removeAllListeners();
    },
  });
}

class ReadableStreamConverter extends AbstractConverter<
  ReadableStream<unknown>
> {
  public getStartEnd(
    _input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(this._getStartEnd(options));
  }

  public typeEquals(input: unknown): input is ReadableStream<unknown> {
    return isReadableStream(input);
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<ReadableStream<unknown> | undefined> {
    if (typeof input === "string" && options.srcStringType === "url") {
      if (input.startsWith("http:") || input.startsWith("https:")) {
        const resp = await fetch(input);
        if (readableConverter().typeEquals(resp.body)) {
          input = resp.body as unknown as Readable;
        } else {
          input = resp.body as ReadableStream<unknown>;
        }
      } else if (input.startsWith("file:") && fileToReadable) {
        input = fileToReadable(input);
      }
    }
    if (blobConverter().typeEquals(input)) {
      if (hasStreamOnBlob) {
        input = input.stream() as unknown as ReadableStream<unknown>;
      }
    }

    const bufferSize = options.bufferSize;
    if (isBrowser) {
      const blob = await blobConverter().convert(input, options);
      if (hasStreamOnBlob) {
        input = blob.stream() as unknown as ReadableStream<unknown>;
      } else {
        return createReadableStream(
          bufferSize,
          await blobConverter().getStartEnd(blob, options),
          (s, e) => blob.slice(s, e),
          (chunk) => chunk.size
        );
      }
    }

    const u8 = await uint8ArrayConverter().convert(input, options);
    if (u8) {
      return createReadableStream(
        bufferSize,
        await uint8ArrayConverter().getStartEnd(u8, options),
        (s, e) => u8.slice(s, e),
        (chunk) => chunk.byteLength
      );
    }

    if (readableConverter().typeEquals(input)) {
      return createReadableStreamOfReader(input, options);
    }

    if (this.typeEquals(input)) {
      const stream = input;
      const reader = stream.getReader();
      const { start, end } = await this.getStartEnd(stream, options);
      return new ReadableStream({
        start: async (controller) => {
          let index = 0;
          let done: boolean;
          do {
            const res = await reader.read();
            const value = res.value;
            done = res.done;
            if (!done) {
              let data: Blob | Uint8Array;
              let size: number;
              if (blobConverter().typeEquals(value)) {
                data = value;
                size = data.size;
              } else {
                data = await uint8ArrayConverter().convert(value as Data);
                size = data.byteLength;
              }
              let e = index + size;
              if (end != null && end < e) e = end;
              if (index < start && start < e) {
                controller.enqueue(data.slice(start, e));
              } else if (start <= index) {
                controller.enqueue(data);
              }
              index += size;
            }
          } while (!done && (end == null || index < end));
          controller.close();
        },
        cancel: (err) => {
          reader
            .cancel(err)
            .catch((e) => console.debug(e))
            .finally(() => closeStream(stream));
        },
      });
    }

    return undefined;
  }

  protected _getSize(
    _input: ReadableStream<unknown>, // eslint-disable-line
    _options: Options // eslint-disable-line
  ): Promise<number> {
    throw new Error("Cannot get size of ReadableStream");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _isEmpty(_: ReadableStream<unknown>): boolean {
    return false;
  }

  protected _merge(
    streams: ReadableStream<unknown>[],
    _: Options // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<ReadableStream<unknown>> {
    const end = streams.length;
    const process = (
      controller: ReadableStreamController<unknown>,
      i: number
    ) => {
      if (i < end) {
        const stream = streams[i] as ReadableStream<unknown>;
        handleReadableStream(stream, (chunk) => {
          controller.enqueue(chunk);
          return Promise.resolve(true);
        })
          .then(() => process(controller, ++i))
          .catch((e) => {
            controller.error(e);
            for (let j = i; j < end; j++) {
              const s = streams[j] as ReadableStream<unknown>;
              closeStream(s);
            }
          });
      } else {
        controller.close();
      }
    };

    return Promise.resolve(
      new ReadableStream({
        start: (converter) => {
          process(converter, 0);
        },
      })
    );
  }

  protected async _toArrayBuffer(
    input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this.toUint8Array(input, options);
    return uint8ArrayConverter().toArrayBuffer(
      u8,
      this.deleteStartLength(options)
    );
  }

  protected async _toBase64(
    input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<string> {
    const bufferSize = options.bufferSize;
    if (isBrowser) {
      const blob = await blobConverter().convert(input, { bufferSize });
      return blobConverter().toBase64(blob, options);
    } else if (isNode) {
      const buffer = await bufferConverter().convert(input, { bufferSize });
      return bufferConverter().toBase64(buffer, options);
    } else {
      const u8 = await uint8ArrayConverter().convert(input, { bufferSize });
      return uint8ArrayConverter().toBase64(u8, options);
    }
  }

  protected async _toText(
    input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<string> {
    const bufferSize = options.bufferSize;
    if (isBrowser) {
      const blob = await blobConverter().convert(input, { bufferSize });
      return blobConverter().toText(blob, options);
    } else if (isNode) {
      const buffer = await bufferConverter().convert(input, { bufferSize });
      return bufferConverter().toText(buffer, options);
    } else {
      const u8 = await uint8ArrayConverter().convert(input, { bufferSize });
      return uint8ArrayConverter().toText(u8, options);
    }
  }

  protected async _toUint8Array(
    input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const converter = uint8ArrayConverter();
    const chunks: Uint8Array[] = [];
    await handleReadableStream(input, async (chunk) => {
      const bufferSize = options.bufferSize;
      const u8 = await converter.convert(chunk, { bufferSize });
      chunks.push(u8);
      return true;
    });
    return converter.merge(chunks, options);
  }

  protected empty(): ReadableStream<unknown> {
    return EMPTY_READABLE_STREAM;
  }
}

export const INSTANCE = new ReadableStreamConverter();
