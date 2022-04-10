import { Duplex, PassThrough, Readable } from "stream";
import {
  blobConverter,
  bufferConverter,
  readableConverter,
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

class ReadableOfReadable extends Readable {
  constructor(
    private src: Readable,
    private start: number,
    private end: number | undefined
  ) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public override async _read() {
    const converter = bufferConverter();
    let index = 0;
    const src = this.src;
    let srcDisposed = false;
    const disposeSrc = () => {
      if (srcDisposed) {
        return;
      }
      srcDisposed = true;
      src.destroy();
      src.removeAllListeners();
    };
    src.once("error", (e) => {
      this.destroy(e);
      disposeSrc();
    });
    src.once("end", () => {
      this.push(null);
      this.destroy();
      disposeSrc();
    });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    src.on("data", async (value) => {
      const chunk = await converter.convert(value as Data);
      const size = chunk.byteLength;
      let e = index + size;
      if (this.end != null && this.end < e) e = this.end;
      let cont: boolean | undefined;
      if (index < this.start && this.start < e) {
        cont = this.push(chunk.slice(this.start, e));
      } else if (this.start <= index) {
        cont = this.push(chunk);
      }
      if (cont === false) {
        disposeSrc();
        this.push(null);
        this.destroy();
        return;
      }
      index += size;
    });
  }
}

class ReadableOfReadableStream extends Readable {
  constructor(
    private stream: ReadableStream<unknown>,
    private start: number,
    private end: number | undefined
  ) {
    super();
  }

  public override async _read() {
    const reader = this.stream.getReader();
    try {
      const converter = bufferConverter();
      let index = 0;
      let done: boolean;
      do {
        const res = await reader.read();
        const value = res.value;
        done = res.done;
        if (value) {
          const chunk = await converter.convert(value as Data);
          const size = chunk.byteLength;
          let e = index + size;
          if (this.end != null && this.end < e) e = this.end;
          let cont: boolean | undefined;
          if (index < this.start && this.start < e) {
            cont = this.push(chunk.slice(this.start, e));
          } else if (this.start <= index) {
            cont = this.push(chunk);
          }
          if (cont === false) {
            break;
          }
          index += size;
        }
      } while (!done && (this.end == null || index < this.end));
      this.push(null);
      this.destroy();
    } catch (e) {
      this.destroy(e as Error);
    } finally {
      reader.cancel().catch((e) => console.debug(e));
      closeStream(this.stream);
    }
  }
}

class ReadableConverter extends AbstractConverter<Readable> {
  public getStartEnd(
    _input: Readable,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(this._getStartEnd(options));
  }

  public typeEquals(input: unknown): input is Readable {
    return isReadable(input);
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<Readable | undefined> {
    if (typeof input === "string" && options.srcStringType === "url") {
      if (input.startsWith("http:") || input.startsWith("https:")) {
        const resp = await fetch(input);
        if (isNode) {
          input = resp.body as unknown as Readable;
        } else {
          input = resp.body as ReadableStream;
        }
      } else if (input.startsWith("file:") && fileToReadable) {
        input = fileToReadable(input);
      }
    }
    if (blobConverter().typeEquals(input)) {
      if (hasStreamOnBlob) {
        input = input.stream() as unknown as ReadableStream;
      }
    }

    if (this.typeEquals(input)) {
      const { start, end } = await readableConverter().getStartEnd(
        input,
        options
      );
      return new ReadableOfReadable(input, start, end);
    }
    if (readableStreamConverter().typeEquals(input)) {
      const { start, end } = await readableStreamConverter().getStartEnd(
        input,
        options
      );
      return new ReadableOfReadableStream(input as ReadableStream, start, end);
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
    const u8 = await this.toUint8Array(input, options);
    return u8.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }

  protected async _toBase64(
    input: Readable,
    options: ConvertOptions
  ): Promise<string> {
    const buffer = (await this.toUint8Array(input, options)) as Buffer;
    return bufferConverter().toBase64(buffer, options);
  }

  protected async _toText(
    input: Readable,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return textHelper().bufferToText(u8, options.bufferToTextCharset);
  }

  protected async _toUint8Array(
    input: Readable,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const { start, end } = await this.getStartEnd(input, options);
    const bufferSize = options.bufferSize;

    let index = 0;
    const converter = bufferConverter();
    const chunks: Buffer[] = [];
    await handleReadable(input, async (chunk) => {
      const buffer = await converter.convert(chunk, { bufferSize });
      const size = buffer.byteLength;
      let e = index + size;
      if (end != null && end < e) e = end;
      if (index < start && start < e) {
        chunks.push(buffer.slice(start, e));
      } else if (start <= index) {
        chunks.push(buffer);
      }
      index += size;
      return end == null || index < end;
    });
    return Buffer.concat(chunks);
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
