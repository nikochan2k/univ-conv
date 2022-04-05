import type { Readable } from "stream";
import {
  blobConverter,
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
  isReadableStream,
} from "./util";

class ReadableStreamConverter extends AbstractConverter<
  ReadableStream<unknown>
> {
  public typeEquals(input: unknown): input is ReadableStream {
    return isReadableStream(input);
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<ReadableStream<unknown> | undefined> {
    if (this.typeEquals(input)) {
      return input;
    }

    if (typeof input === "string" && options.srcStringType === "url") {
      if (input.startsWith("http:") || input.startsWith("https:")) {
        const resp = await fetch(input);
        if (readableConverter().typeEquals(resp.body)) {
          input = resp.body as unknown as Readable;
        } else {
          return resp.body as ReadableStream<unknown>;
        }
      } else if (input.startsWith("file:") && fileToReadable) {
        input = fileToReadable(input);
      }
    }
    if (blobConverter().typeEquals(input)) {
      if (hasStreamOnBlob) {
        return input.stream() as unknown as ReadableStream<unknown>;
      }
    }
    if (readableConverter().typeEquals(input)) {
      const readable = input;
      return new ReadableStream({
        start: (converter) => {
          /* eslint-disable-next-line */
          handleReadable(readable, async (chunk) => converter.enqueue(chunk));
        },
        cancel: (err) => {
          readable.destroy(err as Error);
          readable.removeAllListeners();
        },
      });
    }

    const bufferSize = options.bufferSize;
    if (isBrowser) {
      const blob = await blobConverter().convert(input, options);
      if (hasStreamOnBlob) {
        return blob.stream() as unknown as ReadableStream<unknown>;
      }
      const size = blob.size;
      let start = 0;
      return new ReadableStream({
        start: async (converter) => {
          do {
            const chunk = await new Promise<unknown>((resolve, reject) => {
              try {
                const end = start + bufferSize;
                const sliced = blob.slice(start, end);
                start += sliced.size;
                resolve(sliced);
              } catch (err) {
                converter.close();
                reject(err);
              }
            });
            converter.enqueue(chunk);
          } while (start < size);
          converter.close();
        },
      });
    }

    const u8 = await uint8ArrayConverter().convert(input, options);
    if (u8) {
      const length = u8.byteLength;
      let start = 0;
      return new ReadableStream({
        start: async (converter) => {
          do {
            const chunk = await new Promise<unknown>((resolve, reject) => {
              try {
                const end = start + bufferSize;
                const sliced = u8.slice(start, end);
                start += sliced.byteLength;
                resolve(sliced);
              } catch (err) {
                converter.close();
                reject(err);
              }
            });
            converter.enqueue(chunk);
          } while (start < length);
          converter.close();
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: Options
  ): Promise<ReadableStream<unknown>> {
    const end = streams.length;
    const process = (
      converter: ReadableStreamController<unknown>,
      i: number
    ) => {
      if (i < end) {
        const stream = streams[i] as ReadableStream<unknown>;
        handleReadableStream(stream, (chunk) =>
          Promise.resolve(converter.enqueue(chunk))
        )
          .then(() => process(converter, ++i))
          .catch((e) => {
            converter.error(e);
            for (let j = i; j < end; j++) {
              const s = streams[j] as ReadableStream<unknown>;
              closeStream(s);
            }
          });
      } else {
        converter.close();
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
    return uint8ArrayConverter().toArrayBuffer(u8, options);
  }

  protected async _toBase64(
    input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<string> {
    if (isBrowser) {
      const blob = await blobConverter().convert(input, {
        bufferSize: options.bufferSize,
      });
      return blobConverter().toBase64(blob, options);
    } else {
      const u8 = await uint8ArrayConverter().convert(input, {
        bufferSize: options.bufferSize,
      });
      return uint8ArrayConverter().toBase64(u8, options);
    }
  }

  protected async _toText(
    input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<string> {
    if (isBrowser) {
      const blob = await blobConverter().convert(input, {
        bufferSize: options.bufferSize,
      });
      return blobConverter().toText(blob, options);
    } else {
      const u8 = await uint8ArrayConverter().convert(input, {
        bufferSize: options.bufferSize,
      });
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
      const u8 = await converter.convert(chunk, {
        bufferSize: options.bufferSize,
      });
      chunks.push(u8);
    });
    return converter.merge(chunks);
  }

  protected empty(): ReadableStream<unknown> {
    return EMPTY_READABLE_STREAM;
  }
}

export const INSTANCE = new ReadableStreamConverter();
