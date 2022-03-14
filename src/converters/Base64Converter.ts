import { decode, encode } from "base64-arraybuffer";
import {
  ARRAY_BUFFER_CONVERTER,
  BINARY_STRING_CONVERTER,
  BLOB_CONVERTER,
  EMPTY_ARRAY_BUFFER,
  READABLE_CONVERTER,
  READABLE_STREAM_CONVERTER,
  UINT8_ARRAY_CONVERTER,
  UTF8_CONVERTER,
} from ".";
import { Converter, ConvertOptions, initOptions, typeOf } from "./Converter";

const BASE64_REGEXP =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

class Base64Converter implements Converter<string> {
  public async convert(
    input: unknown,
    options?: ConvertOptions
  ): Promise<string> {
    if (!input) {
      return "";
    }

    options = initOptions(options);
    const chunkSize = options?.chunkSize as number;

    let u8: Uint8Array | undefined;
    if (UINT8_ARRAY_CONVERTER.is(input)) {
      u8 = input;
    } else if (typeof input === "string") {
      const encoding = options?.encoding;
      if (!encoding || encoding === "UTF8") {
        return UTF8_CONVERTER.toBase64(input, chunkSize);
      } else if (encoding === "BinaryString") {
        return BINARY_STRING_CONVERTER.toBase64(input, chunkSize);
      } else if (encoding === "Base64" || BASE64_CONVERTER.is(input)) {
        return BASE64_CONVERTER.toBase64(input, chunkSize);
      }
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

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal input: " + typeOf(input));
  }

  public is(input: unknown): input is string {
    return typeof input === "string" && BASE64_REGEXP.test(input);
  }

  public async merge(chunks: string[]): Promise<string> {
    if (chunks.length === 0) {
      return "";
    }
    if (chunks.length === 1) {
      return chunks[0] as string;
    }

    const bufs: Uint8Array[] = [];
    for (const chunk of chunks) {
      bufs.push(
        await UINT8_ARRAY_CONVERTER.convert(chunk, { encoding: "Base64" })
      );
    }
    const u8 = await UINT8_ARRAY_CONVERTER.merge(bufs);
    return this.convert(u8);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toArrayBuffer(input: string, _: number): Promise<ArrayBuffer> {
    if (!input) {
      return Promise.resolve(EMPTY_ARRAY_BUFFER);
    }

    return Promise.resolve(decode(input));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toBase64(input: string, _: number): Promise<string> {
    return Promise.resolve(input);
  }

  public async toText(input: string, chunkSize: number): Promise<string> {
    const u8 = await this.toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toText(u8, chunkSize);
  }

  public async toUint8Array(
    input: string,
    chunkSize: number
  ): Promise<Uint8Array> {
    const ab = await this.toArrayBuffer(input, chunkSize);
    return ARRAY_BUFFER_CONVERTER.toUint8Array(ab, chunkSize);
  }
}

export const BASE64_CONVERTER = new Base64Converter();
