import { decode, encode } from "base64-arraybuffer";
import {
  BINARY_STRING_CONVERTER,
  BLOB_CONVERTER,
  READABLE_CONVERTER,
  READABLE_STREAM_CONVERTER,
  UINT8_ARRAY_CONVERTER,
} from ".";
import { AbstractConverter, ConvertOptions, Encoding } from "./Converter";
import { ENCODER } from "./Encoder";

class Base64Converter extends AbstractConverter<string> {
  public async _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<string | undefined> {
    const chunkSize = options.chunkSize;

    let u8: Uint8Array | undefined;
    if (UINT8_ARRAY_CONVERTER.is(input)) {
      u8 = input;
    } else if (typeof input === "string") {
      const inputEncoding = options.inputEncoding;
      if (inputEncoding === "base64") {
        return input;
      } else if (inputEncoding === "binary") {
        return BINARY_STRING_CONVERTER.toBase64(input, chunkSize);
      }
      const u8 = await ENCODER.toUint8Array(input, inputEncoding);
      return UINT8_ARRAY_CONVERTER.toBase64(u8, chunkSize);
    } else if (BLOB_CONVERTER.is(input)) {
      return BLOB_CONVERTER.toBase64(input, chunkSize);
    } else if (READABLE_STREAM_CONVERTER.is(input)) {
      u8 = await READABLE_STREAM_CONVERTER.toUint8Array(input, chunkSize);
    } else if (READABLE_CONVERTER.is(input)) {
      u8 = await READABLE_CONVERTER.toUint8Array(input, chunkSize);
    }
    if (u8) {
      return encode(u8);
    }

    return undefined;
  }

  public is(input: unknown): input is string {
    return typeof input === "string";
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
  protected _toArrayBuffer(input: string, _: number): Promise<ArrayBuffer> {
    return Promise.resolve(decode(input));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toBase64(input: string, _: number): Promise<string> {
    return Promise.resolve(input);
  }

  protected async _toText(
    input: string,
    inputEncoding: Encoding,
    chunkSize: number
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, chunkSize);
    return ENCODER.toText(u8, inputEncoding);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toUint8Array(input: string, _: number): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array(decode(input)));
  }

  protected empty(): string {
    return "";
  }
}

export const BASE64_CONVERTER = new Base64Converter();
