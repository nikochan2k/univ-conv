import {
  ARRAY_BUFFER_CONVERTER,
  BLOB_CONVERTER,
  BUFFER_CONVERTER,
  READABLE_CONVERTER,
} from ".";
import { BASE64_CONVERTER } from "./Base64Converter";
import { BINARY_STRING_CONVERTER } from "./BinaryStringConverter";
import { AbstractConverter, ConvertOptions } from "./Converter";
import { UINT8_ARRAY_CONVERTER } from "./Uint8ArrayConverter";

const textEncoder = new TextEncoder();

class UTF8Converter extends AbstractConverter<string> {
  public is(input: unknown): input is string {
    return typeof input === "string";
  }

  protected async _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<string | undefined> {
    const chunkSize = options.chunkSize;

    if (typeof input === "string") {
      const encoding = options?.encoding;
      if (!encoding || encoding === "UTF8") {
        return input;
      } else if (encoding === "BinaryString") {
        return BINARY_STRING_CONVERTER.toText(input, chunkSize);
      } else if (encoding === "Base64") {
        return BASE64_CONVERTER.toText(input, chunkSize);
      }

      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      throw new Error("Illegal encoding: " + encoding);
    }
    if (ARRAY_BUFFER_CONVERTER.is(input)) {
      return ARRAY_BUFFER_CONVERTER.toText(input, chunkSize);
    }
    if (UINT8_ARRAY_CONVERTER.is(input)) {
      return UINT8_ARRAY_CONVERTER.toText(input, chunkSize);
    }
    if (BLOB_CONVERTER.is(input)) {
      return BLOB_CONVERTER.toText(input, chunkSize);
    }
    if (BUFFER_CONVERTER.is(input)) {
      return BUFFER_CONVERTER.toText(input, chunkSize);
    }
    if (READABLE_CONVERTER.is(input)) {
      return READABLE_CONVERTER.toText(input, chunkSize);
    }

    return undefined;
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  protected _merge(chunks: string[]): Promise<string> {
    return Promise.resolve(chunks.join(""));
  }

  protected async _toArrayBuffer(
    input: string,
    chunkSize: number
  ): Promise<ArrayBuffer> {
    const u8 = await this._toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toArrayBuffer(u8, chunkSize);
  }

  protected async _toBase64(input: string, chunkSize: number): Promise<string> {
    const u8 = await this._toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toBase64(u8, chunkSize);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toText(input: string, _: number): Promise<string> {
    return Promise.resolve(input);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toUint8Array(input: string, _: number): Promise<Uint8Array> {
    return Promise.resolve(textEncoder.encode(input));
  }

  protected empty(): string {
    return "";
  }
}

export const UTF8_CONVERTER = new UTF8Converter();
