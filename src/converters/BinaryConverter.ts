import {
  arrayBufferConverter,
  blobConverter,
  uint8ArrayConverter,
} from "./converters";
import { AbstractConverter, ConvertOptions, Data, Options } from "./core";
import { textHelper } from "./TextHelper";
import { handleFileReader, hasReadAsBinaryStringOnBlob, isNode } from "./util";

class BinaryConverter extends AbstractConverter<string> {
  public getStartEnd(
    input: string,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(this._getStartEnd(options, input.length));
  }

  public typeEquals(input: unknown): input is string {
    return typeof input === "string";
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<string | undefined> {
    if (typeof input === "string") {
      if (options.srcStringType === "binary") {
        return input;
      }
    }

    if (blobConverter().typeEquals(input)) {
      if (hasReadAsBinaryStringOnBlob) {
        const startEnd = await blobConverter().getStartEnd(input, options);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _getSize(input: string, _: Options): Promise<number> {
    return Promise.resolve(input.length);
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
    const u8 = this._toUint8ArrayInternal(input);
    return arrayBufferConverter().toArrayBuffer(u8, options);
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = this._toUint8ArrayInternal(input);
    return uint8ArrayConverter().toBase64(u8, options);
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
    return textHelper().bufferToText(u8, options.srcCharset);
  }

  protected async _toUint8Array(
    input: string,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const u8 = this._toUint8ArrayInternal(input);
    return uint8ArrayConverter().toUint8Array(u8, options);
  }

  protected _toUint8ArrayInternal(input: string): Uint8Array {
    let u8: Uint8Array;
    if (isNode) {
      u8 = Buffer.from(input, "binary");
    } else {
      u8 = Uint8Array.from(input.split(""), (e) => e.charCodeAt(0));
    }
    return u8;
  }

  protected empty(): string {
    return "";
  }
}

export const INSTANCE = new BinaryConverter();
