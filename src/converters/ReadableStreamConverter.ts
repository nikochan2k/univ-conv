import {
  blobConverter,
  readableConverter,
  uint8ArrayConverter,
} from "./converters";
import { AbstractConverter, ConvertOptions, Data, Options } from "./core";
import {
  EMPTY_READABLE_STREAM,
  handleReadableStream,
  hasBlob,
  hasStreamOnBlob,
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

    if (blobConverter().typeEquals(input)) {
      if (hasStreamOnBlob) {
        return input.stream() as unknown as ReadableStream<unknown>;
      }
    }
    if (readableConverter().typeEquals(input)) {
      const readable = input;
      return new ReadableStream({
        start: (converter) => {
          readable.once("error", (err) => {
            converter.error(err);
            readable.destroy();
            readable.removeAllListeners();
          });
          readable.once("end", () => {
            converter.close();
            readable.removeAllListeners();
          });
          readable.on("data", (chunk) => converter.enqueue(chunk));
        },
        cancel: (err) => {
          readable.destroy(err as Error);
          readable.removeAllListeners();
        },
      });
    }

    const bufferSize = options.bufferSize;
    if (hasBlob) {
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

  protected async _getSize(
    input: ReadableStream<unknown>,
    options: Options
  ): Promise<number> {
    let length = 0;
    await handleReadableStream(input, async (chunk) => {
      if (blobConverter().typeEquals(chunk)) {
        length += await blobConverter().getSize(chunk, options);
      } else {
        const u8 = await uint8ArrayConverter().convert(chunk, options);
        length += u8.length;
      }
    });
    return length;
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
        handleReadableStream(stream, (chunk) => converter.enqueue(chunk))
          .then(() => process(converter, ++i))
          .catch((e) => {
            converter.error(e);
            for (let j = i; j < end; j++) {
              const s = streams[j] as ReadableStream<unknown>;
              this.close(s);
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
    if (hasBlob) {
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
    if (hasBlob) {
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

  private close(stream: ReadableStream<unknown>) {
    const reader = stream.getReader();
    reader
      .cancel()
      .catch((e) => console.debug(e))
      .finally(() => {
        reader.releaseLock();
        stream.cancel().catch((e) => console.debug(e));
      });
  }
}

export const INSTANCE = new ReadableStreamConverter();
