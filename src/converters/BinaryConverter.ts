import {
  arrayBufferConverter,
  blobConverter,
  uint8ArrayConverter,
} from "./converters";
import {
  AbstractConverter,
  ConvertOptions,
  Data,
  getStartEnd,
  hasNoStartLength,
} from "./core";
import { textHelper } from "./TextHelper";
import { handleFileReader, hasReadAsBinaryStringOnBlob, isNode } from "./util";

class BinaryConverter extends AbstractConverter<string> {
  public empty(): string {
    return "";
  }

  public typeEquals(input: unknown): input is string {
    return typeof input === "string";
  }

  protected _binaryToUint8Array(input: string): Uint8Array {
    let u8: Uint8Array;
    if (isNode) {
      u8 = Buffer.from(input, "binary");
    } else {
      u8 = Uint8Array.from(input.split(""), (e) => e.charCodeAt(0));
    }
    return u8;
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<string | undefined> {
    if (typeof input === "string" && options.srcStringType === "binary") {
      if (hasNoStartLength(options)) {
        return input;
      }
      const { start, end } = await this._getStartEnd(input, options);
      return input.substring(start, end);
    }

    if (blobConverter().typeEquals(input)) {
      if (hasReadAsBinaryStringOnBlob) {
        const startEnd = getStartEnd(options, input.size);
        let start = startEnd.start;
        const end = startEnd.end as number;

        const bufferSize = options.bufferSize;
        const chunks: string[] = [];
        for (; start < end; start += bufferSize) {
          const blobChunk = input.slice(start, start + bufferSize);
          const chunk: string = await handleFileReader(
            (reader) => reader.readAsBinaryString(blobChunk),
            (data) => data as string
          );
          chunks.push(chunk);
        }
        return chunks.join("");
      }
    }
    const u8 = await uint8ArrayConverter().convert(input, options);
    if (u8) {
      return Array.from(u8, (e) => String.fromCharCode(e)).join("");
    }

    return undefined;
  }

  protected _getSize(input: string): Promise<number> {
    return Promise.resolve(input.length);
  }

  protected _getStartEnd(
    input: string,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(getStartEnd(options, input.length));
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  protected _merge(chunks: string[]): Promise<string> {
    return Promise.resolve(chunks.join(""));
  }

  protected async _toArrayBuffer(
    input: string,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = this._binaryToUint8Array(input);
    return arrayBufferConverter().toArrayBuffer(u8, options);
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = this._binaryToUint8Array(input);
    return uint8ArrayConverter().toBase64(u8, options);
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return textHelper().bufferToText(u8, options.bufferToTextCharset);
  }

  protected async _toUint8Array(
    input: string,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const u8 = this._binaryToUint8Array(input);
    return uint8ArrayConverter().toUint8Array(u8, options);
  }
}

export const INSTANCE = new BinaryConverter();
