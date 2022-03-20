import {
  BASE64_CONVERTER,
  BINARY_STRING_CONVERTER,
  BLOB_CONVERTER,
  READABLE_CONVERTER,
  READABLE_STREAM_CONVERTER,
  UINT8_ARRAY_CONVERTER,
} from ".";
import {
  AbstractConverter,
  ConvertOptions,
  EMPTY_ARRAY_BUFFER,
  Encoding,
  Options,
} from "./Converter";
import { ENCODER } from "./Encoder";
import { HEX_CONVERTER } from "./HexConverter";

class ArrayBufferConverter extends AbstractConverter<ArrayBuffer> {
  public async _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<ArrayBuffer | undefined> {
    if (this.typeEquals(input)) {
      return input;
    }

    const chunkSize = options.chunkSize;
    if (typeof input === "string") {
      const inputEncoding = options.inputEncoding;
      if (inputEncoding === "base64") {
        return BASE64_CONVERTER.toArrayBuffer(input, chunkSize);
      } else if (inputEncoding === "binary") {
        return BINARY_STRING_CONVERTER.toArrayBuffer(input, chunkSize);
      } else if (inputEncoding === "hex") {
        return HEX_CONVERTER.toArrayBuffer(input, chunkSize);
      }
      input = ENCODER.toUint8Array(input, inputEncoding);
    }
    if (UINT8_ARRAY_CONVERTER.typeEquals(input)) {
      return UINT8_ARRAY_CONVERTER.toArrayBuffer(input, chunkSize);
    }
    if (BLOB_CONVERTER.typeEquals(input)) {
      return BLOB_CONVERTER.toArrayBuffer(input, chunkSize);
    }
    if (READABLE_STREAM_CONVERTER.typeEquals(input)) {
      return READABLE_STREAM_CONVERTER.toArrayBuffer(input, chunkSize);
    }
    if (READABLE_CONVERTER.typeEquals(input)) {
      return READABLE_CONVERTER.toArrayBuffer(input, chunkSize);
    }

    return undefined;
  }

  public typeEquals(input: unknown): input is ArrayBuffer {
    return (
      input instanceof ArrayBuffer ||
      toString.call(input) === "[object ArrayBuffer]"
    );
  }

  protected _isEmpty(input: ArrayBuffer): boolean {
    return 0 === input.byteLength;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _merge(chunks: ArrayBuffer[], _: Options): Promise<ArrayBuffer> {
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

  protected _toArrayBuffer(
    input: ArrayBuffer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: number
  ): Promise<ArrayBuffer> {
    return Promise.resolve(input);
  }

  protected async _toBase64(
    input: ArrayBuffer,
    chunkSize: number
  ): Promise<string> {
    const u8 = new Uint8Array(input);
    return UINT8_ARRAY_CONVERTER.toBase64(u8, chunkSize);
  }

  protected async _toText(
    input: ArrayBuffer,
    inputEncoding: Encoding,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: number
  ): Promise<string> {
    const u8 = new Uint8Array(input);
    return ENCODER.toText(u8, inputEncoding);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toUint8Array(input: ArrayBuffer, _: number): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array(input));
  }

  protected empty(): ArrayBuffer {
    return EMPTY_ARRAY_BUFFER;
  }
}

export const ARRAY_BUFFER_CONVERTER = new ArrayBufferConverter();
