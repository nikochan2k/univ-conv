import {
  BASE64_CONVERTER,
  BINARY_STRING_CONVERTER,
  BLOB_CONVERTER,
  READABLE_CONVERTER,
  READABLE_STREAM_CONVERTER,
  UINT8_ARRAY_CONVERTER,
  UTF8_CONVERTER,
} from ".";
import { Converter, ConvertOptions, initOptions, typeOf } from "./Converter";
import { EMPTY_UINT8_ARRAY } from "./Uint8ArrayConverter";

export const EMPTY_ARRAY_BUFFER = new ArrayBuffer(0);

class ArrayBufferConverter implements Converter<ArrayBuffer> {
  public async convert(
    input: unknown,
    options?: ConvertOptions
  ): Promise<ArrayBuffer> {
    if (!input) {
      return EMPTY_ARRAY_BUFFER;
    }
    if (this.is(input)) {
      return input;
    }

    options = initOptions(options);
    const chunkSize = options.chunkSize as number;

    if (typeof input === "string") {
      const encoding = options?.encoding;
      if (!encoding || encoding === "UTF8") {
        return UTF8_CONVERTER.toUint8Array(input, chunkSize);
      } else if (encoding === "BinaryString") {
        return BINARY_STRING_CONVERTER.toUint8Array(input, chunkSize);
      } else if (encoding === "Base64" || BASE64_CONVERTER.is(input)) {
        return BASE64_CONVERTER.toUint8Array(input, chunkSize);
      }

      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      throw new Error("Illegal encoding: " + encoding);
    }
    if (UINT8_ARRAY_CONVERTER.is(input)) {
      return UINT8_ARRAY_CONVERTER.toArrayBuffer(input, chunkSize);
    }
    if (BLOB_CONVERTER.is(input)) {
      return BLOB_CONVERTER.toArrayBuffer(input, chunkSize);
    }
    if (READABLE_STREAM_CONVERTER.is(input)) {
      return READABLE_STREAM_CONVERTER.toArrayBuffer(input, chunkSize);
    }
    if (READABLE_CONVERTER.is(input)) {
      return READABLE_CONVERTER.toArrayBuffer(input, chunkSize);
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal input: " + typeOf(input));
  }

  public is(input: unknown): input is ArrayBuffer {
    return (
      input instanceof ArrayBuffer ||
      toString.call(input) === "[object ArrayBuffer]"
    );
  }

  public merge(chunks: ArrayBuffer[]): Promise<ArrayBuffer> {
    if (chunks.length === 0) {
      return Promise.resolve(EMPTY_ARRAY_BUFFER);
    }
    if (chunks.length === 1) {
      return Promise.resolve(chunks[0] as ArrayBuffer);
    }

    const byteLength = chunks.reduce((sum, chunk) => {
      return sum + chunk.byteLength;
    }, 0);
    const u8 = new Uint8Array(byteLength);
    let pos = 0;
    for (const chunk of chunks) {
      u8.set(new Uint8Array(chunk), pos);
      pos += chunk.byteLength;
    }
    return Promise.resolve(u8.buffer);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toArrayBuffer(input: ArrayBuffer, _?: number): Promise<ArrayBuffer> {
    if (!input) {
      return Promise.resolve(EMPTY_ARRAY_BUFFER);
    }

    return Promise.resolve(input);
  }

  public async toBase64(
    input: ArrayBuffer,
    chunkSize: number
  ): Promise<string> {
    if (!input) {
      return "";
    }

    const u8 = await this.toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toBase64(u8, chunkSize);
  }

  public async toText(input: ArrayBuffer, chunkSize: number): Promise<string> {
    if (!input) {
      return "";
    }

    const u8 = await this.toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toText(u8, chunkSize);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toUint8Array(input: ArrayBuffer, _: number): Promise<Uint8Array> {
    if (!input) {
      return Promise.resolve(EMPTY_UINT8_ARRAY);
    }

    return Promise.resolve(new Uint8Array(input));
  }
}

export const ARRAY_BUFFER_CONVERTER = new ArrayBufferConverter();
