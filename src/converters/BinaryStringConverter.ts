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
import { handleFileReader } from "./common";
import { Converter, ConvertOptions, initOptions } from "./Converter";
import { EMPTY_UINT8_ARRAY } from "./Uint8ArrayConverter";

export const EMPTY_BINARY_STRING = "";

class BinaryStringConverter implements Converter<string> {
  public async convert(
    input: unknown,
    options?: ConvertOptions
  ): Promise<string> {
    if (!input) {
      return "";
    }

    options = initOptions(options);
    const chunkSize = options.chunkSize as number;

    let u8: Uint8Array | undefined;
    if (UINT8_ARRAY_CONVERTER.is(input)) {
      u8 = input;
    } else if (typeof input === "string") {
      const encoding = options?.encoding;
      if (encoding === "Base64") {
        u8 = await BASE64_CONVERTER.toUint8Array(input, chunkSize);
      } else if (encoding === "BinaryString") {
        return input;
      } else {
        u8 = await UINT8_ARRAY_CONVERTER.convert(input, options);
      }
    } else if (BLOB_CONVERTER.is(input)) {
      if (hasReadAsBinaryStringOnBlob) {
        const chunkSize = options.chunkSize as number;
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
    if (!u8) {
      return "";
    }

    return Array.from(u8, (e) => String.fromCharCode(e)).join("");
  }

  public is(input: unknown): input is string {
    return typeof input === "string";
  }

  public merge(chunks: string[]): Promise<string> {
    return Promise.resolve(chunks.join(""));
  }

  public async toArrayBuffer(
    input: string,
    chunkSize: number
  ): Promise<ArrayBuffer> {
    const u8 = await this.toUint8Array(input, chunkSize);
    return ARRAY_BUFFER_CONVERTER.toArrayBuffer(u8, chunkSize);
  }

  public async toBase64(input: string, chunkSize: number): Promise<string> {
    if (!input) {
      return "";
    }

    const u8 = await this.toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toBase64(u8, chunkSize);
  }

  public async toText(input: string, chunkSize: number): Promise<string> {
    if (!input) {
      return "";
    }

    const u8 = await this.toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toText(u8, chunkSize);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toUint8Array(input: string, _: number): Promise<Uint8Array> {
    if (!input) {
      return Promise.resolve(EMPTY_UINT8_ARRAY);
    }

    if (hasBuffer) {
      return Promise.resolve(Buffer.from(input, "binary"));
    } else {
      return Promise.resolve(
        Uint8Array.from(input.split(""), (e) => e.charCodeAt(0))
      );
    }
  }
}

export const BINARY_STRING_CONVERTER = new BinaryStringConverter();
