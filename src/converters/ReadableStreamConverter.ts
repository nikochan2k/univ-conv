import {
  BLOB_CONVERTER,
  EMPTY_READABLE_STREAM,
  hasBlob,
  hasStreamOnBlob,
  READABLE_CONVERTER,
} from ".";
import { AbstractConverter, ConvertOptions, Encoding } from "./Converter";
import { UINT8_ARRAY_CONVERTER } from "./Uint8ArrayConverter";

export async function handleReadableStream(
  stream: ReadableStream,
  onData: (chunk: unknown) => Promise<void> | void
): Promise<void> {
  const reader = stream.getReader();
  try {
    let res = await reader.read();
    while (!res.done) {
      const chunk = res.value as unknown;
      if (chunk != null) {
        await onData(chunk);
      }
      res = await reader.read();
    }
    reader.releaseLock();
    reader.cancel().catch((e) => console.warn(e));
  } catch (err) {
    reader.releaseLock();
    reader.cancel(err).catch((e) => console.warn(e));
    throw err;
  } finally {
    stream.cancel().catch((e) => console.warn(e));
  }
}

class ReadableStreamConverter extends AbstractConverter<
  ReadableStream<unknown>
> {
  public is(input: unknown): input is ReadableStream {
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
    if (this.is(input)) {
      return input;
    }

    if (BLOB_CONVERTER.is(input)) {
      if (hasStreamOnBlob) {
        return input.stream() as unknown as ReadableStream<unknown>;
      }
    }
    if (READABLE_CONVERTER.is(input)) {
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
    chunkSize: number
  ): Promise<ArrayBuffer> {
    const u8 = await this.toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toArrayBuffer(u8, chunkSize);
  }

  protected async _toBase64(
    input: ReadableStream<unknown>,
    chunkSize: number
  ): Promise<string> {
    if (hasBlob) {
      const blob = await BLOB_CONVERTER.convert(input, { chunkSize });
      return BLOB_CONVERTER.toBase64(blob, chunkSize);
    } else {
      const u8 = await UINT8_ARRAY_CONVERTER.convert(input, { chunkSize });
      return UINT8_ARRAY_CONVERTER.toBase64(u8, chunkSize);
    }
  }

  protected async _toText(
    input: ReadableStream<unknown>,
    inputEncoding: Encoding,
    chunkSize: number
  ): Promise<string> {
    if (hasBlob) {
      const blob = await BLOB_CONVERTER.convert(input, { chunkSize });
      return BLOB_CONVERTER.toText(blob, inputEncoding, chunkSize);
    } else {
      const u8 = await UINT8_ARRAY_CONVERTER.convert(input, { chunkSize });
      return UINT8_ARRAY_CONVERTER.toText(u8, inputEncoding, chunkSize);
    }
  }

  protected async _toUint8Array(
    input: ReadableStream<unknown>,
    chunkSize: number
  ): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    await handleReadableStream(input, async (chunk) => {
      const u8 = await UINT8_ARRAY_CONVERTER.convert(chunk, { chunkSize });
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
