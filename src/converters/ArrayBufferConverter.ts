import {
  base64Converter,
  binaryConverter,
  blobConverter,
  hexConverter,
  readableConverter,
  readableStreamConverter,
  uint8ArrayConverter,
  urlConverter,
} from "./converters";
import {
  AbstractConverter,
  ConvertOptions,
  Data,
  EMPTY_ARRAY_BUFFER,
  Options,
} from "./core";
import { textHelper } from "./TextHelper";
import { isNode } from "./util";

class ArrayBufferConverter extends AbstractConverter<ArrayBuffer> {
  public getStartEnd(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(this._getStartEnd(options, input.byteLength));
  }

  public typeEquals(input: unknown): input is ArrayBuffer {
    return (
      input instanceof ArrayBuffer ||
      toString.call(input) === "[object ArrayBuffer]"
    );
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<ArrayBuffer | undefined> {
    if (this.typeEquals(input)) {
      return input;
    }

    if (typeof input === "string") {
      const srcStringType = options.srcStringType;
      if (srcStringType === "base64") {
        return base64Converter().toArrayBuffer(input, options);
      } else if (srcStringType === "binary") {
        return binaryConverter().toArrayBuffer(input, options);
      } else if (srcStringType === "hex") {
        return hexConverter().toArrayBuffer(input, options);
      } else if (srcStringType === "url") {
        return urlConverter().toArrayBuffer(input, options);
      }
      input = await textHelper().textToBuffer(input, options.dstCharset);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _getSize(input: ArrayBuffer, _: Options): Promise<number> {
    return Promise.resolve(input.byteLength);
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
    return Promise.resolve(
      u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
    );
  }

  protected async _toArrayBuffer(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    if (options.start == null && options.length == null) {
      return input;
    }
    const { start, end } = await this.getStartEnd(input, options);
    return input.slice(start, end);
  }

  protected async _toBase64(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
    return uint8ArrayConverter().toBase64(u8, options);
  }

  protected async _toText(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
    return textHelper().bufferToText(u8, options.srcCharset);
  }

  protected async _toUint8Array(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const ab = await this._toArrayBuffer(input, options);
    return isNode ? Buffer.from(ab) : new Uint8Array(ab);
  }

  protected empty(): ArrayBuffer {
    return EMPTY_ARRAY_BUFFER;
  }
}

export const INSTANCE = new ArrayBufferConverter();
