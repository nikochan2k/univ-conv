import {
  arrayBufferConverter,
  base64Converter,
  binaryConverter,
  blobConverter,
  bufferConverter,
  hexConverter,
  readableConverter,
  readableStreamConverter,
  uint8ArrayConverter,
} from "./converters";
import { AbstractConverter, ConvertOptions, Data, Options } from "./core";

class TextConverter extends AbstractConverter<string> {
  public typeEquals(input: unknown): input is string {
    return typeof input === "string";
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<string | undefined> {
    if (typeof input === "string") {
      const srcStringType = options.srcStringType;
      if (srcStringType === "base64") {
        return base64Converter().toText(input, options);
      } else if (srcStringType === "binary") {
        return binaryConverter().toText(input, options);
      } else if (srcStringType === "hex") {
        return hexConverter().toText(input, options);
      }
      return input;
    }
    if (arrayBufferConverter().typeEquals(input)) {
      return arrayBufferConverter().toText(input, options);
    }
    if (uint8ArrayConverter().typeEquals(input)) {
      return uint8ArrayConverter().toText(input, options);
    }
    if (blobConverter().typeEquals(input)) {
      return blobConverter().toText(input, options);
    }
    if (bufferConverter().typeEquals(input)) {
      return bufferConverter().toText(input, options);
    }
    if (readableConverter().typeEquals(input)) {
      return readableConverter().toText(input, options);
    }
    if (readableStreamConverter().typeEquals(input)) {
      return readableStreamConverter().toText(input, options);
    }

    return undefined;
  }

  protected async _getSize(input: string, options: Options): Promise<number> {
    const u8 = await this.toUint8Array(input, options);
    return u8.byteLength;
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _merge(chunks: string[], _: Options): Promise<string> {
    return Promise.resolve(chunks.join(""));
  }

  protected async _toArrayBuffer(
    input: string,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this._toUint8Array(input, options);
    return uint8ArrayConverter().toArrayBuffer(u8, options);
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
    return uint8ArrayConverter().toBase64(u8, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toText(input: string, _: ConvertOptions): Promise<string> {
    return Promise.resolve(input);
  }

  protected _toUint8Array(
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: ConvertOptions
  ): Promise<Uint8Array> {
    const u8 = new Uint8Array(input.length * 2);
    for (let i = 0; i < u8.length; i += 2) {
      let x = input.charCodeAt(i / 2);
      const a = x % 256;
      x -= a;
      x /= 256;
      u8[i] = x;
      u8[i + 1] = a;
    }
    return Promise.resolve(u8);
  }

  protected empty(): string {
    return "";
  }
}

export const INSTANCE = new TextConverter();
