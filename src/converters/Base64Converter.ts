import { decode, encode } from "base64-arraybuffer";
import {
  BINARY_STRING_CONVERTER,
  BLOB_CONVERTER,
  UINT8_ARRAY_CONVERTER,
} from ".";
import { AbstractConverter, ConvertOptions } from "./Converter";
import { HEX_CONVERTER } from "./HexConverter";
import { TEXT_HELPER } from "./TextHelper";

class Base64Converter extends AbstractConverter<string> {
  public typeEquals(input: unknown): input is string {
    return typeof input === "string";
  }

  protected async _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<string | undefined> {
    if (!options.inputEncoding) options.inputEncoding = "utf16le";
    if (!options.outputEncoding) options.outputEncoding = "utf8";
    let u8: Uint8Array | undefined;
    if (typeof input === "string") {
      const inputEncoding = options.inputEncoding;
      if (inputEncoding === "base64") {
        return input;
      } else if (inputEncoding === "binary") {
        return BINARY_STRING_CONVERTER.toBase64(input, options);
      } else if (inputEncoding === "hex") {
        return HEX_CONVERTER.toBase64(input, options);
      }
      u8 = await TEXT_HELPER.textToBuffer(
        input,
        options.inputEncoding || "utf16le",
        options.outputEncoding || "utf-8"
      );
    } else if (BLOB_CONVERTER.typeEquals(input)) {
      return BLOB_CONVERTER.toBase64(input, options);
    } else {
      u8 = await UINT8_ARRAY_CONVERTER.convert(input, options);
    }
    if (u8) {
      return encode(u8);
    }

    return undefined;
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  protected async _merge(chunks: string[]): Promise<string> {
    const bufs: Uint8Array[] = [];
    for (const chunk of chunks) {
      bufs.push(
        await UINT8_ARRAY_CONVERTER.convert(chunk, { inputEncoding: "base64" })
      );
    }
    const u8 = await UINT8_ARRAY_CONVERTER.merge(bufs);
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
    return TEXT_HELPER.bufferToText(
      u8,
      options.inputEncoding,
      options.outputEncoding
    );
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

export const BASE64_CONVERTER = new Base64Converter();
