import { decode } from "base64-arraybuffer";
import {
  arrayBufferConverter,
  binaryConverter,
  blobConverter,
  bufferConverter,
  hexConverter,
  readableConverter,
  readableStreamConverter,
  uint8ArrayConverter,
  urlConverter,
} from "./converters";
import {
  AbstractConverter,
  ConvertOptions,
  Data,
  deleteStartLength,
  getStartEnd,
  hasNoStartLength,
  Options,
} from "./core";
import { textHelper } from "./TextHelper";
import { isBrowser, isNode } from "./util";

class Base64Converter extends AbstractConverter<string> {
  public empty(): string {
    return "";
  }

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
        return this.toBase64(input, options);
      } else if (srcStringType === "binary") {
        return binaryConverter().toBase64(input, options);
      } else if (srcStringType === "hex") {
        return hexConverter().toBase64(input, options);
      } else if (srcStringType === "url") {
        return urlConverter().toBase64(input, options);
      }
      if (
        typeof atob === "function" &&
        options.textToBufferCharset === "utf8" &&
        hasNoStartLength(options)
      ) {
        return atob(input);
      }
      input = await textHelper().textToBuffer(
        input,
        options.textToBufferCharset
      );
    }
    if (arrayBufferConverter().typeEquals(input)) {
      return arrayBufferConverter().toBase64(input, options);
    }
    if (bufferConverter().typeEquals(input)) {
      return bufferConverter().toBase64(input, options);
    }
    if (uint8ArrayConverter().typeEquals(input)) {
      return uint8ArrayConverter().toBase64(input, options);
    }
    if (blobConverter().typeEquals(input)) {
      return blobConverter().toBase64(input, options);
    }
    if (readableStreamConverter().typeEquals(input)) {
      return readableStreamConverter().toBase64(input, options);
    }
    if (readableConverter().typeEquals(input)) {
      return readableConverter().toBase64(input, options);
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

  protected async _getStartEnd(
    input: string,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    const size = await this.getSize(input);
    return getStartEnd(options, size);
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  protected async _merge(chunks: string[], options: Options): Promise<string> {
    if (isBrowser) {
      const converter = blobConverter();
      const blobs: Blob[] = [];
      for (const chunk of chunks) {
        blobs.push(await converter.convert(chunk, options));
      }
      const blob = await converter.merge(blobs, options);
      return this.convert(blob);
    } else {
      const buffers: Uint8Array[] = [];
      for (const chunk of chunks) {
        buffers.push(await this.toUint8Array(chunk, options));
      }
      const u8 = await uint8ArrayConverter().merge(buffers, options);
      return this.convert(u8);
    }
  }

  protected _toArrayBuffer(
    input: string,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const ab = decode(input);
    if (hasNoStartLength(options)) {
      return Promise.resolve(ab);
    }
    const { start, end } = getStartEnd(options, ab.byteLength);
    return Promise.resolve(ab.slice(start, end));
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    if (hasNoStartLength(options)) {
      return input;
    }
    const u8 = await this.toUint8Array(input, options);
    return this.convert(u8, deleteStartLength(options));
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    if (
      typeof btoa === "function" &&
      options.bufferToTextCharset === "utf8" &&
      hasNoStartLength(options)
    ) {
      return btoa(input);
    }
    const u8 = await this.toUint8Array(input, options);
    return textHelper().bufferToText(u8, options.bufferToTextCharset);
  }

  protected async _toUint8Array(
    input: string,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const ab = await this.toArrayBuffer(input, options);
    return isNode ? Buffer.from(ab) : new Uint8Array(ab);
  }
}

export const INSTANCE = new Base64Converter();
