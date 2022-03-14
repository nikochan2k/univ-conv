import {
  BLOB_CONVERTER,
  EMPTY_ARRAY_BUFFER,
  EMPTY_READABLE_STREAM,
  hasStreamOnBlob,
  isBrowser,
  READABLE_CONVERTER,
} from ".";
import { Converter, ConvertOptions, initOptions } from "./Converter";
import {
  EMPTY_UINT8_ARRAY,
  UINT8_ARRAY_CONVERTER,
} from "./Uint8ArrayConverter";

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

class ReadableStreamConverter implements Converter<ReadableStream<unknown>> {
  public async convert(
    input: unknown,
    options?: ConvertOptions
  ): Promise<ReadableStream<unknown>> {
    if (!input) {
      return EMPTY_READABLE_STREAM;
    }
    if (this.is(input)) {
      return input;
    }

    options = initOptions(options);

    if (BLOB_CONVERTER.is(input)) {
      if (hasStreamOnBlob) {
        return input.stream() as unknown as ReadableStream<unknown>;
      }
    }
    if (READABLE_CONVERTER.is(input)) {
      const readable = input;
      if (readable.destroyed) {
        return EMPTY_READABLE_STREAM;
      }
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

    const bufferSize = options.chunkSize as number;
    if (isBrowser) {
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

    const u8 = await UINT8_ARRAY_CONVERTER.convert(input, options);
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

  public is(input: unknown): input is ReadableStream {
    return (
      input != null &&
      typeof (input as ReadableStream<unknown>).getReader === "function" &&
      typeof (input as ReadableStream<unknown>).cancel === "function"
    );
  }

  public merge(
    streams: ReadableStream<unknown>[]
  ): Promise<ReadableStream<unknown>> {
    const end = streams.length;
    if (!streams || end === 0) {
      return Promise.resolve(EMPTY_READABLE_STREAM);
    }
    if (end === 1) {
      return Promise.resolve(streams[0] as ReadableStream<unknown>);
    }

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

  public async toArrayBuffer(
    input: ReadableStream<unknown>,
    chunkSize: number
  ): Promise<ArrayBuffer> {
    if (!input) {
      return EMPTY_ARRAY_BUFFER;
    }

    const u8 = await this.toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toArrayBuffer(u8, chunkSize);
  }

  public async toBase64(
    input: ReadableStream<unknown>,
    chunkSize: number
  ): Promise<string> {
    if (!input) {
      return "";
    }

    if (isBrowser) {
      const blob = await BLOB_CONVERTER.convert(input, { chunkSize });
      return BLOB_CONVERTER.toBase64(blob, chunkSize);
    } else {
      const u8 = await UINT8_ARRAY_CONVERTER.convert(input, { chunkSize });
      return UINT8_ARRAY_CONVERTER.toBase64(u8, chunkSize);
    }
  }

  public async toText(
    input: ReadableStream<unknown>,
    chunkSize: number
  ): Promise<string> {
    if (!input) {
      return "";
    }

    if (isBrowser) {
      const blob = await BLOB_CONVERTER.convert(input, { chunkSize });
      return BLOB_CONVERTER.toText(blob, chunkSize);
    } else {
      const u8 = await UINT8_ARRAY_CONVERTER.convert(input, { chunkSize });
      return UINT8_ARRAY_CONVERTER.toText(u8, chunkSize);
    }
  }

  public async toUint8Array(
    input: ReadableStream<unknown>,
    chunkSize: number
  ): Promise<Uint8Array> {
    if (!input) {
      return EMPTY_UINT8_ARRAY;
    }

    const chunks: Uint8Array[] = [];
    await handleReadableStream(input, async (chunk) => {
      const u8 = await UINT8_ARRAY_CONVERTER.convert(chunk, { chunkSize });
      chunks.push(u8);
    });
    return UINT8_ARRAY_CONVERTER.merge(chunks);
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
