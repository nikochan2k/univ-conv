import { Duplex, PassThrough, Readable } from "stream";
import {
  arrayBufferConverter,
  blobConverter,
  bufferConverter,
  readableStreamConverter,
} from "./converters";
import { AbstractConverter, ConvertOptions, Data, Options } from "./core";
import { textHelper } from "./TextHelper";
import {
  closeStream,
  EMPTY_READABLE,
  fileToReadable,
  handleReadable,
  hasStreamOnBlob,
  isNode,
  isReadable,
} from "./util";

class ReadableOfReadableStream extends Readable {
  private reader: ReadableStreamDefaultReader<unknown> | undefined;
  constructor(private rs: ReadableStream<unknown> | undefined) {
    super();
    this.reader = rs?.getReader();
  }
  override _read = () => {
    if (!this.reader) {
      return;
    }
    this.reader
      .read()
      .then(({ value, done }) => {
        if (value) {
          this.push(value);
        }
        if (done) {
          this.push(null);
          closeStream(this.rs);
        }
      })
      .catch((e) => closeStream(this.rs, e));
  };
}

class ReadableConverter extends AbstractConverter<Readable> {
  public typeEquals(input: unknown): input is Readable {
    return isReadable(input);
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<Readable | undefined> {
    if (this.typeEquals(input)) {
      return input;
    }

    if (typeof input === "string" && options.srcStringType === "url") {
      if (input.startsWith("http:") || input.startsWith("https:")) {
        const resp = await fetch(input);
        if (isNode) {
          return resp.body as unknown as Readable;
        }
        input = resp.body as ReadableStream<unknown>;
      } else if (input.startsWith("file:") && fileToReadable) {
        return fileToReadable(input);
      }
    }
    if (blobConverter().typeEquals(input)) {
      if (hasStreamOnBlob) {
        input = input.stream() as unknown as ReadableStream<unknown>;
      }
    }
    if (readableStreamConverter().typeEquals(input)) {
      return new ReadableOfReadableStream(input);
    }

    const buffer = await bufferConverter().convert(input, options);
    if (buffer) {
      const duplex = new Duplex();
      duplex.push(buffer);
      duplex.push(null);
      return duplex;
    }

    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _getSize(_input: Readable, _options: Options): Promise<number> {
    throw new Error("Cannot get size of Readable");
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
        readable.pipe(pt, { end: false });
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
    const buffer = (await this._toUint8Array(input, options)) as Buffer;
    return bufferConverter().toBase64(buffer, options);
  }

  protected async _toText(
    input: Readable,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return textHelper().bufferToText(u8, options.srcCharset);
  }

  protected async _toUint8Array(
    input: Readable,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const converter = bufferConverter();
    const buffers: Buffer[] = [];
    await handleReadable(input, async (chunk) => {
      const buffer = await converter.convert(chunk, {
        bufferSize: options.bufferSize,
      });
      buffers.push(buffer);
    });
    return Buffer.concat(buffers);
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
