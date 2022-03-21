import {
  base64Converter,
  binaryConverter,
  blobConverter,
  hexConverter,
  readableConverter,
  readableStreamConverter,
  uint8ArrayConverter,
} from "./converters";
import {
  AbstractConverter,
  ConvertOptions,
  EMPTY_ARRAY_BUFFER,
  InputType,
  Options,
} from "./core";
import { TEXT_HELPER } from "./TextHelper";

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
      const encoding = options.inputEncoding;
      if (encoding === "base64") {
        return base64Converter().toArrayBuffer(input, options);
      } else if (encoding === "binary") {
        return binaryConverter().toArrayBuffer(input, options);
      } else if (encoding === "hex") {
        return hexConverter().toArrayBuffer(input, options);
      }
      input = await TEXT_HELPER.textToBuffer(input, options.outputCharset);
    }
    if (uint8ArrayConverter().typeEquals(input)) {
      return uint8ArrayConverter().toArrayBuffer(input, options);
    }
    if (blobConverter().typeEquals(input)) {
      return blobConverter().toArrayBuffer(input, options);
    }
    if (readableStreamConverter().typeEquals(input)) {
      return readableStreamConverter().toArrayBuffer(input, options);
    }
    if (readableConverter().typeEquals(input)) {
      return readableConverter().toArrayBuffer(input, options);
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
    return uint8ArrayConverter().toBase64(u8, options);
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

export const INSTANCE = new ArrayBufferConverter();
