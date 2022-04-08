import { decode, encode } from "base64-arraybuffer";
import {
  arrayBufferConverter,
  binaryConverter,
  hexConverter,
  uint8ArrayConverter,
  urlConverter,
} from "./converters";
import { AbstractConverter, ConvertOptions, Data, Options } from "./core";
import { textHelper } from "./TextHelper";
import { isNode } from "./util";

class Base64Converter extends AbstractConverter<string> {
  public async getStartEnd(
    input: string,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    const size = await this.getSize(input);
    return this._getStartEnd(options, size);
  }

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

  protected async _toArrayBuffer(
    input: string,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const ab = decode(input);
    if (options.start == null && options.length == null) {
      return ab;
    }
    const { start, end } = await arrayBufferConverter().getStartEnd(
      ab,
      options
    );
    return ab.slice(start, end);
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    if (options.start == null && options.length == null) {
      return input;
    }
    const u8 = await this.toUint8Array(input, options);
    return this.convert(u8, this.deleteStartLength(options));
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return textHelper().bufferToText(u8, options.srcCharset);
  }

  protected async _toUint8Array(
    input: string,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const ab = await this.toArrayBuffer(input, options);
    return isNode ? Buffer.from(ab) : new Uint8Array(ab);
  }

  protected empty(): string {
    return "";
  }
}

export const INSTANCE = new Base64Converter();
