import { decode, encode } from "base64-arraybuffer";
import { BINARY_CONVERTER } from "./BinaryConverter";
import { AbstractConverter } from "./Converter";
import { HEX_CONVERTER } from "./HexConverter";
import { TEXT_HELPER } from "./TextHelper";
import { ConvertOptions, InputType, Options } from "./types";
import { UINT8_ARRAY_CONVERTER } from "./Uint8ArrayConverter";
import { BLOB_CONVERTER } from "./compatibility";

class Base64Converter extends AbstractConverter<string> {
  public typeEquals(input: unknown): input is string {
    return typeof input === "string";
  }

  protected async _convert(
    input: InputType,
    options: ConvertOptions
  ): Promise<string | undefined> {
    let u8: Uint8Array | undefined;
    if (typeof input === "string") {
      const encoding = options.inputEncoding;
      if (encoding === "base64") {
        return input;
      } else if (encoding === "binary") {
        return BINARY_CONVERTER.toBase64(input, options);
      } else if (encoding === "hex") {
        return HEX_CONVERTER.toBase64(input, options);
      }
      u8 = await TEXT_HELPER.textToBuffer(input, options.outputCharset);
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

  protected async _merge(chunks: string[], options: Options): Promise<string> {
    const bufs: Uint8Array[] = [];
    for (const chunk of chunks) {
      bufs.push(await UINT8_ARRAY_CONVERTER.convert(chunk, options));
    }
    const u8 = await UINT8_ARRAY_CONVERTER.merge(bufs, options);
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
    return TEXT_HELPER.bufferToText(u8, options.inputCharset);
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
