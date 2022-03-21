import { encode } from "base64-arraybuffer";
import {
  arrayBufferConverter,
  base64Converter,
  binaryConverter,
  blobConverter,
  bufferConverter,
  hexConverter,
  readableConverter,
  readableStreamConverter,
} from "./converters";
import {
  AbstractConverter,
  ConvertOptions,
  EMPTY_UINT8_ARRAY,
  Data,
  Options,
} from "./core";
import { textHelper } from "./TextHelper";
class Uint8ArrayConverter extends AbstractConverter<Uint8Array> {
  public typeEquals(input: unknown): input is Uint8Array {
    return (
      bufferConverter().typeEquals(input) ||
      input instanceof Uint8Array ||
      toString.call(input) === "[object Uint8Array]"
    );
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<Uint8Array | undefined> {
    if (this.typeEquals(input)) {
      return input;
    }

    if (typeof input === "string") {
      const encoding = options.inputEncoding;
      if (encoding === "base64") {
        return base64Converter().toUint8Array(input, options);
      } else if (encoding === "binary") {
        return binaryConverter().toUint8Array(input, options);
      } else if (encoding === "hex") {
        return hexConverter().toUint8Array(input, options);
      } else {
        return textHelper().textToBuffer(input, options.outputCharset);
      }
    }
    if (arrayBufferConverter().typeEquals(input)) {
      return arrayBufferConverter().toUint8Array(input, options);
    }
    if (blobConverter().typeEquals(input)) {
      return blobConverter().toUint8Array(input, options);
    }
    if (readableStreamConverter().typeEquals(input)) {
      return readableStreamConverter().toUint8Array(input, options);
    }
    if (readableConverter().typeEquals(input)) {
      return readableConverter().toUint8Array(input, options);
    }

    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _getSize(input: Uint8Array, _: Options): Promise<number> {
    return Promise.resolve(input.byteLength);
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
    return textHelper().bufferToText(input, options.inputCharset);
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

export const INSTANCE = new Uint8ArrayConverter();
