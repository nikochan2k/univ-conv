import { arrayBufferConverter, uint8ArrayConverter } from "./converters";
import { AbstractConverter, ConvertOptions, Data, Options } from "./core";
import { textHelper } from "./TextHelper";
import { EMPTY_BUFFER } from "./util";

class BufferConverter extends AbstractConverter<Buffer> {
  public typeEquals(input: unknown): input is Buffer {
    return (
      input instanceof Buffer || toString.call(input) === "[object Buffer]"
    );
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<Buffer | undefined> {
    if (this.typeEquals(input)) {
      return input;
    }

    if (typeof input === "string") {
      const type = options.srcStringType;
      if (type == null || type === "text") {
        const u8 = await textHelper().textToBuffer(input, options.dstCharset);
        return u8 as Buffer;
      } else if (type === "base64") {
        return Buffer.from(input, "base64");
      } else if (type === "binary") {
        return Buffer.from(input, "binary");
      } else if (type === "hex") {
        return Buffer.from(input, "hex");
      }
    }
    if (uint8ArrayConverter().typeEquals(input)) {
      return Buffer.from(input.buffer, input.byteOffset, input.byteLength);
    }

    const ab = await arrayBufferConverter().convert(input, options);
    if (ab) {
      return Buffer.from(ab);
    }

    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _getSize(input: Buffer, _: Options): Promise<number> {
    return Promise.resolve(input.byteLength);
  }

  protected _isEmpty(input: Buffer): boolean {
    return 0 === input.byteLength;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _merge(chunks: Buffer[], _: Options): Promise<Buffer> {
    return Promise.resolve(Buffer.concat(chunks));
  }

  protected async _toArrayBuffer(
    input: Buffer,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    return uint8ArrayConverter().toArrayBuffer(input, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toBase64(input: Buffer, _: ConvertOptions): Promise<string> {
    return Promise.resolve(input.toString("base64"));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toText(input: Buffer, options: ConvertOptions): Promise<string> {
    return textHelper().bufferToText(input, options.srcCharset);
  }

  protected _toUint8Array(input: Buffer): Promise<Uint8Array> {
    return Promise.resolve(input);
  }

  protected empty(): Buffer {
    return EMPTY_BUFFER;
  }
}

export const INSTANCE = new BufferConverter();
