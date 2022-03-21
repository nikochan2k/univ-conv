import { ARRAY_BUFFER_CONVERTER } from "./ArrayBufferConverter";
import { BASE64_CONVERTER } from "./Base64Converter";
import { BINARY_CONVERTER } from "./BinaryConverter";
import { AbstractConverter, ConvertOptions, Options } from "./Converter";
import { HEX_CONVERTER } from "./HexConverter";
import { TEXT_HELPER } from "./TextHelper";
import { UINT8_ARRAY_CONVERTER } from "./Uint8ArrayConverter";
import { BLOB_CONVERTER, BUFFER_CONVERTER, READABLE_CONVERTER } from "./z";

class TextConverter extends AbstractConverter<string> {
  public typeEquals(input: unknown): input is string {
    return typeof input === "string";
  }

  protected async _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<string | undefined> {
    if (!options.outputCharset) options.outputCharset = "utf16le";

    if (typeof input === "string") {
      const encoding = options.encoding;
      if (encoding === "base64") {
        return BASE64_CONVERTER.toText(input, options);
      } else if (encoding === "binary") {
        return BINARY_CONVERTER.toText(input, options);
      } else if (encoding === "hex") {
        return HEX_CONVERTER.toText(input, options);
      }
      input = TEXT_HELPER.textToBuffer(input, options.outputCharset);
    }
    if (ARRAY_BUFFER_CONVERTER.typeEquals(input)) {
      return ARRAY_BUFFER_CONVERTER.toText(input, options);
    }
    if (UINT8_ARRAY_CONVERTER.typeEquals(input)) {
      return UINT8_ARRAY_CONVERTER.toText(input, options);
    }
    if (BLOB_CONVERTER.typeEquals(input)) {
      return BLOB_CONVERTER.toText(input, options);
    }
    if (BUFFER_CONVERTER.typeEquals(input)) {
      return BUFFER_CONVERTER.toText(input, options);
    }
    if (READABLE_CONVERTER.typeEquals(input)) {
      return READABLE_CONVERTER.toText(input, options);
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
    return UINT8_ARRAY_CONVERTER.toArrayBuffer(u8, options);
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
    return UINT8_ARRAY_CONVERTER.toBase64(u8, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toText(input: string, _: ConvertOptions): Promise<string> {
    return Promise.resolve(input);
  }

  protected _toUint8Array(
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: ConvertOptions
  ): Promise<Uint8Array> {
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
