import { decode, encode } from "base64-arraybuffer";
import {
  binaryConverter,
  blobConverter,
  hexConverter,
  uint8ArrayConverter,
  urlConverter,
} from "./converters";
import { AbstractConverter, ConvertOptions, Data, Options } from "./core";
import { textHelper } from "./TextHelper";

class Base64Converter extends AbstractConverter<string> {
  public typeEquals(input: unknown): input is string {
    return typeof input === "string";
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<string | undefined> {
    let u8: Uint8Array | undefined;
    if (typeof input === "string") {
      const srcStringType = options.srcStringType;
      if (srcStringType === "base64") {
        return input;
      } else if (srcStringType === "binary") {
        return binaryConverter().toBase64(input, options);
      } else if (srcStringType === "hex") {
        return hexConverter().toBase64(input, options);
      } else if (srcStringType === "url") {
        return urlConverter().toBase64(input, options);
      }
      u8 = await textHelper().textToBuffer(input, options.dstCharset);
    } else if (blobConverter().typeEquals(input)) {
      return blobConverter().toBase64(input, options);
    } else {
      u8 = await uint8ArrayConverter().convert(input, options);
    }
    if (u8) {
      return encode(u8);
    }

    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _getSize(input: string, _: Options): Promise<number> {
    const len = input.length;
    const baseLen = (len * 3) / 4;
    let padding = 0;
    for (let i = len - 1; input[i] === "="; i--) {
      padding++;
    }
    const size = baseLen - padding;
    return Promise.resolve(size);
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  protected async _merge(chunks: string[], options: Options): Promise<string> {
    const converter = uint8ArrayConverter();
    const bufs: Uint8Array[] = [];
    for (const chunk of chunks) {
      bufs.push(await converter.convert(chunk, options));
    }
    const u8 = await converter.merge(bufs, options);
    return this.convert(u8);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toArrayBuffer(
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: ConvertOptions
  ): Promise<ArrayBuffer> {
    return Promise.resolve(decode(input));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toBase64(input: string, _: ConvertOptions): Promise<string> {
    return Promise.resolve(input);
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return textHelper().bufferToText(u8, options.srcCharset);
  }

  protected _toUint8Array(
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: ConvertOptions
  ): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array(decode(input)));
  }

  protected empty(): string {
    return "";
  }
}

export const INSTANCE = new Base64Converter();
