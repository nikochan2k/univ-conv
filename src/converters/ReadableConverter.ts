import { PassThrough, Readable } from "stream";
import {
  ARRAY_BUFFER_CONVERTER,
  BLOB_CONVERTER,
  BUFFER_CONVERTER,
  READABLE_STREAM_CONVERTER,
  UINT8_ARRAY_CONVERTER,
} from ".";
import { Converter, ConvertOptions, initOptions } from "./Converter";
import { EMPTY_UINT8_ARRAY } from "./Uint8ArrayConverter";

class ReadableConverter implements Converter<Readable> {
  public async convert(
    input: unknown,
    options?: ConvertOptions
  ): Promise<Readable> {
    if (!input) {
      return this.createEmptyReadable();
    }
    if (this.is(input)) {
      return input;
    }

    options = initOptions(options);

    if (BLOB_CONVERTER.is(input)) {
      input = input.stream() as unknown as ReadableStream<unknown>;
    }
    if (READABLE_STREAM_CONVERTER.is(input)) {
      const stream = input;
      const reader = input.getReader();
      return new Readable({
        read() {
          reader
            .read()
            .then(({ value, done }) => {
              if (value) {
                this.push(value);
              }
              if (done) {
                this.push(null);
                reader.releaseLock();
                reader.cancel().catch((e) => console.warn(e));
              }
            })
            .catch((e) => {
              reader.releaseLock();
              reader.cancel(e).catch((e) => console.warn(e));
            })
            .finally(() => {
              stream.cancel().catch((e) => console.warn(e));
            });
        },
      });
    }

    const buffer = await BUFFER_CONVERTER.convert(input, options);
    return Readable.from(buffer);
  }

  public is(input: unknown): input is Readable {
    return (
      input != null &&
      typeof (input as Readable).pipe === "function" &&
      typeof (input as Readable)._read === "function"
    );
  }

  public merge(readables: Readable[]): Promise<Readable> {
    const end = readables.length;
    if (!readables || end === 0) {
      return Promise.resolve(this.createEmptyReadable());
    }
    if (end === 1) {
      return Promise.resolve(readables[0] as Readable);
    }

    const pt = new PassThrough();
    const process = (i: number) => {
      if (i < end) {
        const readable = readables[i] as Readable;
        readable.pipe(pt, { end: false });
        readable.once("error", (e) => {
          readable.unpipe();
          pt.emit("error", e);
          for (let j = i; j < end; j++) {
            const r = readables[j] as Readable;
            r.destroy();
          }
          pt.destroy();
        });
        readable.once("end", () => process(++i));
      } else {
        pt.end();
      }
    };
    process(0);
    return Promise.resolve(pt);
  }

  public async toArrayBuffer(
    input: Readable,
    chunkSize: number
  ): Promise<ArrayBuffer> {
    if (!input || input.destroyed) {
      return EMPTY_UINT8_ARRAY;
    }

    const u8 = await this.toUint8Array(input, chunkSize);
    return ARRAY_BUFFER_CONVERTER.convert(u8);
  }

  public async toBase64(input: Readable, chunkSize: number): Promise<string> {
    if (!input || input.destroyed) {
      return "";
    }

    const u8 = await this.toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toBase64(u8, chunkSize);
  }

  public async toText(input: Readable, chunkSize: number): Promise<string> {
    if (!input || input.destroyed) {
      return "";
    }

    const u8 = await this.toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toText(u8, chunkSize);
  }

  public async toUint8Array(
    input: Readable,
    chunkSize: number
  ): Promise<Uint8Array> {
    if (!input || input.destroyed) {
      return EMPTY_UINT8_ARRAY;
    }

    const chunks: Uint8Array[] = [];
    await this.handleReadable(input, async (chunk) => {
      const u8 = await UINT8_ARRAY_CONVERTER.convert(chunk, { chunkSize });
      chunks.push(u8);
    });
    return UINT8_ARRAY_CONVERTER.merge(chunks);
  }

  private createEmptyReadable(): Promise<Readable> {
    return Promise.resolve(
      new Readable({
        read() {
          this.push(Buffer.alloc(0));
          this.push(null);
        },
      })
    );
  }

  private async handleReadable(
    readable: Readable,
    onData: (chunk: unknown) => Promise<void> | void
  ): Promise<void> {
    if (readable.destroyed) {
      return;
    }
    return new Promise<void>((resolve, reject) => {
      readable.once("error", (e) => {
        reject(e);
        readable.destroy();
        readable.removeAllListeners();
      });
      readable.once("end", () => {
        resolve();
        readable.removeAllListeners();
      });
      readable.on("data", (chunk) => void (async () => await onData(chunk))());
    });
  }
}

export const READABLE_CONVERTER = new ReadableConverter();