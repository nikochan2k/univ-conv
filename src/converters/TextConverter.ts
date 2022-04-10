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
import { textHelper } from "./TextHelper";

class TextConverter extends AbstractConverter<string> {
  public empty(): string {
    return "";
  }

  public async getStartEnd(
    input: string,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    const u8 = await this.toUint8Array(input, this.deleteStartLength(options));
    return this._getStartEnd(options, u8.byteLength);
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
        return base64Converter().toText(input, options);
      } else if (srcStringType === "binary") {
        return binaryConverter().toText(input, options);
      } else if (srcStringType === "hex") {
        return hexConverter().toText(input, options);
      } else if (srcStringType === "url") {
        input = await uint8ArrayConverter().convert(
          input,
          this.deleteStartLength(options)
        );
      } else {
        return this.toText(input, options);
      }
    }
    if (arrayBufferConverter().typeEquals(input)) {
      return arrayBufferConverter().toText(input, options);
    }
    if (bufferConverter().typeEquals(input)) {
      return bufferConverter().toText(input, options);
    }
    if (uint8ArrayConverter().typeEquals(input)) {
      return uint8ArrayConverter().toText(input, options);
    }
    if (blobConverter().typeEquals(input)) {
      return blobConverter().toText(input, options);
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
    const u8 = await this.toUint8Array(input, options);
    return uint8ArrayConverter().toArrayBuffer(
      u8,
      this.deleteStartLength(options)
    );
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return uint8ArrayConverter().toBase64(u8, this.deleteStartLength(options));
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    if (
      options.start == null &&
      options.length == null &&
      options.bufferToTextCharset === options.textToBufferCharset
    ) {
      return input;
    }
    const u8 = await this.toUint8Array(input, options);
    return textHelper().bufferToText(u8, options.bufferToTextCharset);
  }

  protected async _toUint8Array(
    input: string,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const u8 = await textHelper().textToBuffer(
      input,
      options.textToBufferCharset
    );
    return uint8ArrayConverter().toUint8Array(u8, options);
  }
}

export const INSTANCE = new TextConverter();
