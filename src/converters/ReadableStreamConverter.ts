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
        const end = blob.size;
        let start = 0;
        return new ReadableStream<unknown>({
          start: (controller) => {
            do {
              let e = start + bufferSize;
              if (end < e) e = end;
              const chunk = blob.slice(start, e);
              controller.enqueue(chunk);
              start += chunk.size;
            } while (start < end);
            controller.close();
          },
        });
      }
    }

    const u8 = await uint8ArrayConverter().convert(input, options);
    if (u8) {
      const end = u8.byteLength;
      let start = 0;
      return new ReadableStream({
        start: (converter) => {
          do {
            let e = start + bufferSize;
            if (end < e) e = end;
            const chunk = u8.slice(start, e);
            converter.enqueue(chunk);
            start += chunk.byteLength;
          } while (start < end);
          converter.close();
        },
      });
    }

    if (readableConverter().typeEquals(input)) {
      const readable = input;
      const { start, end } = await readableConverter().getStartEnd(
        readable,
        options
      );
      const converter = bufferConverter();
      let index = 0;
      return new ReadableStream({
        start: async (controller) => {
          await handleReadable(readable, async (chunk) => {
            const buffer = await converter.convert(chunk, { bufferSize });
            const size = buffer.byteLength;
            let e = index + size;
            if (end != null && end < e) e = end;
            if (index < start && start < e) {
              controller.enqueue(buffer.slice(start, e));
            } else if (start <= index) {
              controller.enqueue(buffer);
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

    if (this.typeEquals(input)) {
      const stream = input;
      const { start, end } = await this.getStartEnd(stream, options);
      return new ReadableStream({
        start: async (controller) => {
          const reader = stream.getReader();
          let index = 0;
          let done = false;
          do {
            const res = await reader.read();
            const value = res.value;
            done = res.done;
            if (!done) {
              if (blobConverter().typeEquals(value)) {
                const blob = await blobConverter().convert(value);
                const size = blob.size;
                const e = index + size;
                if (index < start && start < e) {
                  controller.enqueue(blob.slice(start, e));
                } else if (start <= index) {
                  controller.enqueue(blob);
                }
                index += size;
              } else {
                const u8 = await uint8ArrayConverter().convert(value as Data);
                const size = u8.byteLength;
                const e = index + size;
                if (index < start && start < e) {
                  controller.enqueue(u8.slice(start, e));
                } else if (start <= index) {
                  controller.enqueue(u8);
                }
                index += size;
              }
            }
          } while (!done && (end == null || index < end));
          controller.close();
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
    const converter = isNode ? bufferConverter() : uint8ArrayConverter();
    const chunks: Uint8Array[] = [];
    await handleReadableStream(input, async (chunk) => {
      const bufferSize = options.bufferSize;
      const u8 = await converter.convert(chunk, { bufferSize });
      chunks.push(u8);
      return true;
    });
    return converter.merge(chunks as any); // eslint-disable-line
  }

  protected empty(): ReadableStream<unknown> {
    return EMPTY_READABLE_STREAM;
  }
}

export const INSTANCE = new ReadableStreamConverter();
