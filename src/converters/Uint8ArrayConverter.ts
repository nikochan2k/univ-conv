import { encode } from "base64-arraybuffer";
import {
  ARRAY_BUFFER_CONVERTER,
  BASE64_CONVERTER,
  BINARY_STRING_CONVERTER,
  BLOB_CONVERTER,
  BUFFER_CONVERTER,
  READABLE_CONVERTER,
  READABLE_STREAM_CONVERTER,
} from ".";
import {
  AbstractConverter,
  ConvertOptions,
  Encoding,
  Options,
} from "./Converter";
import { ENCODER } from "./Encoder";
import { HEX_CONVERTER } from "./HexConverter";

export const EMPTY_UINT8_ARRAY = new Uint8Array(0);

class Uint8ArrayConverter extends AbstractConverter<Uint8Array> {
  public typeEquals(input: unknown): input is Uint8Array {
    return (
      BUFFER_CONVERTER.typeEquals(input) ||
      input instanceof Uint8Array ||
      toString.call(input) === "[object Uint8Array]"
    );
  }

  protected async _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<Uint8Array | undefined> {
    if (this.typeEquals(input)) {
      return input;
    }

    const chunkSize = options.chunkSize;
    if (typeof input === "string") {
      const inputEncoding = options?.inputEncoding;
      if (inputEncoding === "base64") {
        return BASE64_CONVERTER.toUint8Array(input, chunkSize);
      } else if (inputEncoding === "binary") {
        return BINARY_STRING_CONVERTER.toUint8Array(input, chunkSize);
      } else if (inputEncoding === "hex") {
        return HEX_CONVERTER.toUint8Array(input, chunkSize);
      } else {
        return ENCODER.toUint8Array(input, inputEncoding);
      }
    }
    if (ARRAY_BUFFER_CONVERTER.typeEquals(input)) {
      return ARRAY_BUFFER_CONVERTER.toUint8Array(input, chunkSize);
    }
    if (BLOB_CONVERTER.typeEquals(input)) {
      return BLOB_CONVERTER.toUint8Array(input, chunkSize);
    }
    if (READABLE_STREAM_CONVERTER.typeEquals(input)) {
      return READABLE_STREAM_CONVERTER.toUint8Array(input, chunkSize);
    }
    if (READABLE_CONVERTER.typeEquals(input)) {
      return READABLE_CONVERTER.toUint8Array(input, chunkSize);
    }

    return undefined;
  }

  protected _isEmpty(input: Uint8Array): boolean {
    return input.byteLength === 0;
  }

  protected async _merge(
    chunks: Uint8Array[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: Options
  ): Promise<Uint8Array> {
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
  protected _toArrayBuffer(input: Uint8Array, _: number): Promise<ArrayBuffer> {
    return Promise.resolve(
      input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toBase64(input: Uint8Array, _: number): Promise<string> {
    return Promise.resolve(encode(input));
  }

  protected _toText(
    input: Uint8Array,
    inputEncoding: Encoding,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: number
  ): Promise<string> {
    return ENCODER.toText(input, inputEncoding);
  }

  protected _toUint8Array(
    input: Uint8Array,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: number
  ): Promise<Uint8Array> {
    return Promise.resolve(input);
  }

  protected empty(): Uint8Array {
    return EMPTY_UINT8_ARRAY;
  }
}

export const UINT8_ARRAY_CONVERTER = new Uint8ArrayConverter();
