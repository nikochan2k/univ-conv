import {
  ARRAY_BUFFER_CONVERTER,
  BASE64_CONVERTER,
  BLOB_CONVERTER,
  hasBuffer,
  hasReadAsBinaryStringOnBlob,
  READABLE_CONVERTER,
  READABLE_STREAM_CONVERTER,
  UINT8_ARRAY_CONVERTER,
} from ".";
import {
  AbstractConverter,
  ConvertOptions,
  Encoding,
  handleFileReader,
} from "./Converter";
import { ENCODER } from "./Encoder";

class BinaryStringConverter extends AbstractConverter<string> {
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
        u8 = await BASE64_CONVERTER.toUint8Array(input, chunkSize);
      } else if (inputEncoding === "binary") {
        return input;
      } else {
        u8 = await ENCODER.toUint8Array(input, inputEncoding);
      }
    } else if (BLOB_CONVERTER.is(input)) {
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
      u8 = await BLOB_CONVERTER.toUint8Array(input, chunkSize);
    } else if (READABLE_STREAM_CONVERTER.is(input)) {
      u8 = await READABLE_STREAM_CONVERTER.toUint8Array(input, chunkSize);
    } else if (READABLE_CONVERTER.is(input)) {
      u8 = await READABLE_CONVERTER.toUint8Array(input, chunkSize);
    }
    if (u8) {
      return Array.from(u8, (e) => String.fromCharCode(e)).join("");
    }

    return undefined;
  }

  public is(input: unknown): input is string {
    return typeof input === "string";
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
    return ARRAY_BUFFER_CONVERTER.toArrayBuffer(u8, chunkSize);
  }

  protected async _toBase64(input: string, chunkSize: number): Promise<string> {
    const u8 = await this._toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toBase64(u8, chunkSize);
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

export const BINARY_STRING_CONVERTER = new BinaryStringConverter();
