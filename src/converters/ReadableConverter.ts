import { PassThrough, Readable } from "stream";
import {
  arrayBufferConverter,
  blobConverter,
  bufferConverter,
  readableStreamConverter,
  uint8ArrayConverter,
} from "./converters";
import { AbstractConverter, ConvertOptions, Data, Options } from "./core";
import { textHelper } from "./TextHelper";
import { EMPTY_READABLE, handleReadable, hasStreamOnBlob } from "./util";

class ReadableConverter extends AbstractConverter<Readable> {
  public typeEquals(input: unknown): input is Readable {
    return (
      input != null &&
      typeof (input as Readable).pipe === "function" &&
      typeof (input as Readable)._read === "function"
    );
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<Readable | undefined> {
    if (this.typeEquals(input)) {
      return input;
    }

    if (blobConverter().typeEquals(input)) {
      if (hasStreamOnBlob) {
        input = input.stream() as unknown as ReadableStream<unknown>;
      }
    }
    if (readableStreamConverter().typeEquals(input)) {
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
                reader.cancel().catch((e) => console.debug(e));
              }
            })
            .catch((e) => {
              reader.cancel(e).catch((e) => console.debug(e));
            })
            .finally(() => {
              reader.releaseLock();
              stream.cancel().catch((e) => console.debug(e));
            });
        },
      });
    }

    const buffer = await bufferConverter().convert(input, options);
    if (buffer) {
      return Readable.from(buffer);
    }

    return undefined;
  }

  protected async _getSize(input: Readable, options: Options): Promise<number> {
    const converter = uint8ArrayConverter();
    let length = 0;
    await handleReadable(input, async (chunk) => {
      const u8 = await converter.convert(chunk, options);
      length += u8.byteLength;
    });
    return length;
  }

  protected _isEmpty(input: Readable): boolean {
    return !input.readable;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _merge(readables: Readable[], _: Options): Promise<Readable> {
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
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this._toUint8Array(input, options);
    return arrayBufferConverter().convert(u8);
  }

  protected async _toBase64(
    input: Readable,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
    return uint8ArrayConverter().toBase64(u8, options);
  }

  protected async _toText(
    input: Readable,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return textHelper().bufferToText(u8, options.inputCharset);
  }

  protected async _toUint8Array(
    input: Readable,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const converter = uint8ArrayConverter();
    const chunks: Uint8Array[] = [];
    await handleReadable(input, async (chunk) => {
      const u8 = await converter.convert(chunk, {
        chunkSize: options.chunkSize,
      });
      chunks.push(u8);
    });
    return converter.merge(chunks);
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
}

export const INSTANCE = new ReadableConverter();
