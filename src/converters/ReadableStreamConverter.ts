import {
  AbstractConverter,
  ConvertOptions,
  EMPTY_READABLE_STREAM,
  handleReadableStream,
  hasBlob,
  hasStreamOnBlob,
} from "./Converter";
import { UINT8_ARRAY_CONVERTER } from "./Uint8ArrayConverter";
import { BLOB_CONVERTER, READABLE_CONVERTER } from "./z";

class ReadableStreamConverter extends AbstractConverter<
  ReadableStream<unknown>
> {
  public typeEquals(input: unknown): input is ReadableStream {
    return (
      input != null &&
      typeof (input as ReadableStream<unknown>).getReader === "function" &&
      typeof (input as ReadableStream<unknown>).cancel === "function"
    );
  }

  protected async _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<ReadableStream<unknown> | undefined> {
    if (this.typeEquals(input)) {
      return input;
    }

    if (BLOB_CONVERTER.typeEquals(input)) {
      if (hasStreamOnBlob) {
        return input.stream() as unknown as ReadableStream<unknown>;
      }
    }
    if (READABLE_CONVERTER.typeEquals(input)) {
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

    const chunkSize = options.chunkSize;
    if (hasBlob) {
      const blob = await BLOB_CONVERTER.convert(input, options);
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
                const end = start + chunkSize;
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

    const u8 = await UINT8_ARRAY_CONVERTER.convert(input, options);
    if (u8) {
      const length = u8.byteLength;
      let start = 0;
      return new ReadableStream({
        start: async (converter) => {
          do {
            const chunk = await new Promise<unknown>((resolve, reject) => {
              try {
                const end = start + chunkSize;
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _isEmpty(_: ReadableStream<unknown>): boolean {
    return false;
  }

  protected _merge(
    streams: ReadableStream<unknown>[]
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
    return UINT8_ARRAY_CONVERTER.toArrayBuffer(u8, options);
  }

  protected async _toBase64(
    input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<string> {
    if (hasBlob) {
      const blob = await BLOB_CONVERTER.convert(input, {
        chunkSize: options.chunkSize,
      });
      return BLOB_CONVERTER.toBase64(blob, options);
    } else {
      const u8 = await UINT8_ARRAY_CONVERTER.convert(input, {
        chunkSize: options.chunkSize,
      });
      return UINT8_ARRAY_CONVERTER.toBase64(u8, options);
    }
  }

  protected async _toText(
    input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<string> {
    if (hasBlob) {
      const blob = await BLOB_CONVERTER.convert(input, {
        chunkSize: options.chunkSize,
      });
      return BLOB_CONVERTER.toText(blob, options);
    } else {
      const u8 = await UINT8_ARRAY_CONVERTER.convert(input, {
        chunkSize: options.chunkSize,
      });
      return UINT8_ARRAY_CONVERTER.toText(u8, options);
    }
  }

  protected async _toUint8Array(
    input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    await handleReadableStream(input, async (chunk) => {
      const u8 = await UINT8_ARRAY_CONVERTER.convert(chunk, {
        chunkSize: options.chunkSize,
      });
      chunks.push(u8);
    });
    return UINT8_ARRAY_CONVERTER.merge(chunks);
  }

  protected empty(): ReadableStream<unknown> {
    return EMPTY_READABLE_STREAM;
  }

  private close(stream: ReadableStream<unknown>) {
    const reader = stream.getReader();
    reader.releaseLock();
    reader
      .cancel()
      .catch((e) => console.warn(e))
      .finally(() => {
        stream.cancel().catch((e) => console.warn(e));
      });
  }
}

export const READABLE_STREAM_CONVERTER = new ReadableStreamConverter();
