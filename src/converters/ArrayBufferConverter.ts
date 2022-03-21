import { BASE64_CONVERTER } from "./Base64Converter";
import { BINARY_CONVERTER } from "./BinaryConverter";
import {
  AbstractConverter,
  ConvertOptions,
  EMPTY_ARRAY_BUFFER,
  InputType,
  Options,
} from "./Converter";
import { HEX_CONVERTER } from "./HexConverter";
import { TEXT_HELPER } from "./TextHelper";
import { UINT8_ARRAY_CONVERTER } from "./Uint8ArrayConverter";
import {
  BLOB_CONVERTER,
  READABLE_CONVERTER,
  READABLE_STREAM_CONVERTER,
} from "./z";

class ArrayBufferConverter extends AbstractConverter<ArrayBuffer> {
  public typeEquals(input: unknown): input is ArrayBuffer {
    return (
      input instanceof ArrayBuffer ||
      toString.call(input) === "[object ArrayBuffer]"
    );
  }

  protected async _convert(
    input: InputType,
    options: ConvertOptions
  ): Promise<ArrayBuffer | undefined> {
    if (this.typeEquals(input)) {
      return input;
    }

    if (typeof input === "string") {
      const encoding = options.encoding;
      if (encoding === "base64") {
        return BASE64_CONVERTER.toArrayBuffer(input, options);
      } else if (encoding === "binary") {
        return BINARY_CONVERTER.toArrayBuffer(input, options);
      } else if (encoding === "hex") {
        return HEX_CONVERTER.toArrayBuffer(input, options);
      }
      input = await TEXT_HELPER.textToBuffer(input, options.outputCharset);
    }
    if (UINT8_ARRAY_CONVERTER.typeEquals(input)) {
      return UINT8_ARRAY_CONVERTER.toArrayBuffer(input, options);
    }
    if (BLOB_CONVERTER.typeEquals(input)) {
      return BLOB_CONVERTER.toArrayBuffer(input, options);
    }
    if (READABLE_STREAM_CONVERTER.typeEquals(input)) {
      return READABLE_STREAM_CONVERTER.toArrayBuffer(input, options);
    }
    if (READABLE_CONVERTER.typeEquals(input)) {
      return READABLE_CONVERTER.toArrayBuffer(input, options);
    }

    return undefined;
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
    _: ConvertOptions
  ): Promise<ArrayBuffer> {
    return Promise.resolve(input);
  }

  protected async _toBase64(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = new Uint8Array(input);
    return UINT8_ARRAY_CONVERTER.toBase64(u8, options);
  }

  protected async _toText(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = new Uint8Array(input);
    return TEXT_HELPER.bufferToText(u8, options.inputCharset);
  }

  protected _toUint8Array(
    input: ArrayBuffer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: ConvertOptions
  ): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array(input));
  }

  protected empty(): ArrayBuffer {
    return EMPTY_ARRAY_BUFFER;
  }
}

export const ARRAY_BUFFER_CONVERTER = new ArrayBufferConverter();
