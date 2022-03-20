import { PassThrough, Readable } from "stream";
import {
  ARRAY_BUFFER_CONVERTER,
  BLOB_CONVERTER,
  BUFFER_CONVERTER,
  EMPTY_READABLE,
  hasStreamOnBlob,
  READABLE_STREAM_CONVERTER,
  UINT8_ARRAY_CONVERTER,
} from ".";
import { AbstractConverter, ConvertOptions, Encoding } from "./Converter";
import { ENCODER } from "./Encoder";

class ReadableConverter extends AbstractConverter<Readable> {
  public typeEquals(input: unknown): input is Readable {
    return (
      input != null &&
      typeof (input as Readable).pipe === "function" &&
      typeof (input as Readable)._read === "function"
    );
  }

  protected async _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<Readable | undefined> {
    if (this.typeEquals(input)) {
      return input;
    }

    if (BLOB_CONVERTER.typeEquals(input)) {
      if (hasStreamOnBlob) {
        input = input.stream() as unknown as ReadableStream<unknown>;
      }
    }
    if (READABLE_STREAM_CONVERTER.typeEquals(input)) {
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
    if (buffer) {
      return Readable.from(buffer);
    }

    return undefined;
  }

  protected _isEmpty(input: Readable): boolean {
    return !input.readable;
  }

  protected _merge(readables: Readable[]): Promise<Readable> {
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

  protected async _toArrayBuffer(
    input: Readable,
    chunkSize: number
  ): Promise<ArrayBuffer> {
    const u8 = await this._toUint8Array(input, chunkSize);
    return ARRAY_BUFFER_CONVERTER.convert(u8);
  }

  protected async _toBase64(
    input: Readable,
    chunkSize: number
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toBase64(u8, chunkSize);
  }

  protected async _toText(
    input: Readable,
    inputEncoding: Encoding,
    chunkSize: number
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, chunkSize);
    return ENCODER.toText(u8, inputEncoding);
  }

  protected async _toUint8Array(
    input: Readable,
    chunkSize: number
  ): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    await this.handleReadable(input, async (chunk) => {
      const u8 = await UINT8_ARRAY_CONVERTER.convert(chunk, { chunkSize });
      chunks.push(u8);
    });
    return UINT8_ARRAY_CONVERTER.merge(chunks);
  }

  protected empty(): Readable {
    return EMPTY_READABLE;
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
