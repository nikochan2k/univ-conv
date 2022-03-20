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
import { AbstractConverter, ConvertOptions, Options } from "./Converter";
import { HEX_CONVERTER } from "./HexConverter";
import { TEXT_HELPER } from "./TextHelper";

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

    if (!options.outputCharset) options.outputCharset = "utf8";

    if (typeof input === "string") {
      const encoding = options.encoding;
      if (encoding === "base64") {
        return BASE64_CONVERTER.toUint8Array(input, options);
      } else if (encoding === "binary") {
        return BINARY_STRING_CONVERTER.toUint8Array(input, options);
      } else if (encoding === "hex") {
        return HEX_CONVERTER.toUint8Array(input, options);
      } else {
        return TEXT_HELPER.textToBuffer(input, options.outputCharset);
      }
    }
    if (ARRAY_BUFFER_CONVERTER.typeEquals(input)) {
      return ARRAY_BUFFER_CONVERTER.toUint8Array(input, options);
    }
    if (BLOB_CONVERTER.typeEquals(input)) {
      return BLOB_CONVERTER.toUint8Array(input, options);
    }
    if (READABLE_STREAM_CONVERTER.typeEquals(input)) {
      return READABLE_STREAM_CONVERTER.toUint8Array(input, options);
    }
    if (READABLE_CONVERTER.typeEquals(input)) {
      return READABLE_CONVERTER.toUint8Array(input, options);
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

  protected _toArrayBuffer(
    input: Uint8Array,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: ConvertOptions
  ): Promise<ArrayBuffer> {
    return Promise.resolve(
      input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toBase64(input: Uint8Array, _: ConvertOptions): Promise<string> {
    return Promise.resolve(encode(input));
  }

  protected _toText(
    input: Uint8Array,
    options: ConvertOptions
  ): Promise<string> {
    return TEXT_HELPER.bufferToText(input, options.inputCharset);
  }

  protected _toUint8Array(
    input: Uint8Array,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: ConvertOptions
  ): Promise<Uint8Array> {
    return Promise.resolve(input);
  }

  protected empty(): Uint8Array {
    return EMPTY_UINT8_ARRAY;
  }
}

export const UINT8_ARRAY_CONVERTER = new Uint8ArrayConverter();
