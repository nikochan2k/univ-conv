import { encode } from "base64-arraybuffer";
import {
  ARRAY_BUFFER_CONVERTER,
  BASE64_CONVERTER,
  BINARY_STRING_CONVERTER,
  BLOB_CONVERTER,
  BUFFER_CONVERTER,
  EMPTY_ARRAY_BUFFER,
  READABLE_CONVERTER,
  READABLE_STREAM_CONVERTER,
  UTF8_CONVERTER,
} from ".";
import { Converter, ConvertOptions, initOptions, typeOf } from "./Converter";

export const EMPTY_UINT8_ARRAY = new Uint8Array(0);

const textDecoder = new TextDecoder();

class Uint8ArrayConverter implements Converter<Uint8Array> {
  public async convert(
    input: unknown,
    options?: ConvertOptions
  ): Promise<Uint8Array> {
    if (!input) {
      return EMPTY_UINT8_ARRAY;
    }
    if (this.is(input)) {
      return input;
    }

    options = initOptions(options);
    const chunkSize = options.chunkSize as number;

    if (typeof input === "string") {
      const encoding = options?.encoding;
      if (encoding === "Base64") {
        return BASE64_CONVERTER.toUint8Array(input, chunkSize);
      } else if (encoding === "BinaryString") {
        return BINARY_STRING_CONVERTER.toUint8Array(input, chunkSize);
      } else {
        return UTF8_CONVERTER.toUint8Array(input, chunkSize);
      }
    }
    if (ARRAY_BUFFER_CONVERTER.is(input)) {
      return ARRAY_BUFFER_CONVERTER.toUint8Array(input, chunkSize);
    }
    if (BLOB_CONVERTER.is(input)) {
      return BLOB_CONVERTER.toUint8Array(input, chunkSize);
    }
    if (READABLE_STREAM_CONVERTER.is(input)) {
      return READABLE_STREAM_CONVERTER.toUint8Array(input, chunkSize);
    }
    if (READABLE_CONVERTER.is(input)) {
      return READABLE_CONVERTER.toUint8Array(input, chunkSize);
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal input: " + typeOf(input));
  }

  public is(input: unknown): input is Uint8Array {
    return (
      BUFFER_CONVERTER.is(input) ||
      input instanceof Uint8Array ||
      toString.call(input) === "[object Uint8Array]"
    );
  }

  public async merge(chunks: Uint8Array[]): Promise<Uint8Array> {
    if (chunks.length === 0) {
      return Promise.resolve(EMPTY_UINT8_ARRAY);
    }
    if (chunks.length === 1) {
      return Promise.resolve(chunks[0] as Uint8Array);
    }

    const byteLength = chunks.reduce((sum, chunk) => {
      return sum + chunk.byteLength;
    }, 0);

    const u8 = new Uint8Array(byteLength);
    let pos = 0;
    for (const chunk of chunks) {
      u8.set(chunk, pos);
      pos += chunk.byteLength;
    }
    return Promise.resolve(u8);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toArrayBuffer(input: Uint8Array, _: number): Promise<ArrayBuffer> {
    if (!input) {
      return Promise.resolve(EMPTY_ARRAY_BUFFER);
    }

    return Promise.resolve(
      input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toBase64(input: Uint8Array, _: number): Promise<string> {
    if (!input) {
      return Promise.resolve("");
    }

    return Promise.resolve(encode(input));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toText(input: Uint8Array, _: number): Promise<string> {
    if (!input) {
      return Promise.resolve("");
    }

    return Promise.resolve(textDecoder.decode(input));
  }

  public toUint8Array(
    input: Uint8Array,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: number
  ): Promise<Uint8Array> {
    if (!input) {
      return Promise.resolve(EMPTY_UINT8_ARRAY);
    }

    return Promise.resolve(input);
  }
}

export const UINT8_ARRAY_CONVERTER = new Uint8ArrayConverter();
