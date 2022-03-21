import { ARRAY_BUFFER_CONVERTER } from "./ArrayBufferConverter";
import {
  AbstractConverter,
  handleFileReader,
  hasBuffer,
  hasReadAsBinaryStringOnBlob,
} from "./Converter";
import { TEXT_HELPER } from "./TextHelper";
import { ConvertOptions, InputType, Options } from "./types";
import { UINT8_ARRAY_CONVERTER } from "./Uint8ArrayConverter";
import { BLOB_CONVERTER } from "./compatibility";

class BinaryConverter extends AbstractConverter<string> {
  public typeEquals(input: unknown): input is string {
    return typeof input === "string";
  }

  protected async _convert(
    input: InputType,
    options: ConvertOptions
  ): Promise<string | undefined> {
    if (typeof input === "string") {
      if (options.inputEncoding === "binary") {
        return input;
      }
    } else if (BLOB_CONVERTER.typeEquals(input)) {
      if (hasReadAsBinaryStringOnBlob) {
        const chunkSize = options.chunkSize;
        const chunks: string[] = [];
        for (let start = 0, end = input.size; start < end; start += chunkSize) {
          const blobChunk = input.slice(start, start + chunkSize);
          const chunk: string = await handleFileReader(
            (reader) => reader.readAsBinaryString(blobChunk),
            (data) => data as string
          );
          chunks.push(chunk);
        }
        return chunks.join("");
      }
    }
    const u8 = await UINT8_ARRAY_CONVERTER.convert(input, options);
    if (u8) {
      return Array.from(u8, (e) => String.fromCharCode(e)).join("");
    }

    return undefined;
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
    return ARRAY_BUFFER_CONVERTER.toArrayBuffer(u8, options);
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
    return UINT8_ARRAY_CONVERTER.toBase64(u8, options);
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return TEXT_HELPER.bufferToText(u8, options.inputCharset);
  }

  protected _toUint8Array(
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: ConvertOptions
  ): Promise<Uint8Array> {
    if (hasBuffer) {
      return Promise.resolve(Buffer.from(input, "binary"));
    } else {
      return Promise.resolve(
        Uint8Array.from(input.split(""), (e) => e.charCodeAt(0))
      );
    }
  }

  protected empty(): string {
    return "";
  }
}

export const BINARY_CONVERTER = new BinaryConverter();
