import {
  ARRAY_BUFFER_CONVERTER,
  BLOB_CONVERTER,
  BUFFER_CONVERTER,
  READABLE_CONVERTER,
} from ".";
import { BASE64_CONVERTER } from "./Base64Converter";
import { BINARY_STRING_CONVERTER } from "./BinaryStringConverter";
import { AbstractConverter, ConvertOptions, Encoding } from "./Converter";
import { TEXT_HELPER } from "./TextHelper";
import { HEX_CONVERTER } from "./HexConverter";
import { UINT8_ARRAY_CONVERTER } from "./Uint8ArrayConverter";

class TextConverter extends AbstractConverter<string> {
  public typeEquals(input: unknown): input is string {
    return typeof input === "string";
  }

  protected async _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<string | undefined> {
    const chunkSize = options.chunkSize;

    const inputEnoding = options.inputEncoding;
    if (typeof input === "string") {
      if (inputEnoding === "utf16le") {
        return input;
      } else if (inputEnoding === "base64") {
        return BASE64_CONVERTER.toText(input, inputEnoding, chunkSize);
      } else if (inputEnoding === "binary") {
        return BINARY_STRING_CONVERTER.toText(input, inputEnoding, chunkSize);
      } else if (inputEnoding === "hex") {
        return HEX_CONVERTER.toText(input, inputEnoding, chunkSize);
      }
      input = TEXT_HELPER.toUint8Array(input, inputEnoding);
    }
    if (ARRAY_BUFFER_CONVERTER.typeEquals(input)) {
      return ARRAY_BUFFER_CONVERTER.toText(input, inputEnoding, chunkSize);
    }
    if (UINT8_ARRAY_CONVERTER.typeEquals(input)) {
      return UINT8_ARRAY_CONVERTER.toText(input, inputEnoding, chunkSize);
    }
    if (BLOB_CONVERTER.typeEquals(input)) {
      return BLOB_CONVERTER.toText(input, inputEnoding, chunkSize);
    }
    if (BUFFER_CONVERTER.typeEquals(input)) {
      return BUFFER_CONVERTER.toText(input, inputEnoding, chunkSize);
    }
    if (READABLE_CONVERTER.typeEquals(input)) {
      return READABLE_CONVERTER.toText(input, inputEnoding, chunkSize);
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
  protected _toText(input: string, _1: Encoding, _2: number): Promise<string> {
    return Promise.resolve(input);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toUint8Array(input: string, _: number): Promise<Uint8Array> {
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

export const TEXT_CONVERTER = new TextConverter();
