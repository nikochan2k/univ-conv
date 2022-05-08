import {
  base64Converter,
  binaryConverter,
  blobConverter,
  bufferConverter,
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
  getStartEnd,
  hasNoStartLength,
  Options,
} from "./core";
import { textHelper } from "./TextHelper";
import { isNode } from "./util";

class ArrayBufferConverter extends AbstractConverter<ArrayBuffer> {
  public empty(): ArrayBuffer {
    return EMPTY_ARRAY_BUFFER;
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
      return this.toArrayBuffer(input, options);
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
      input = await textHelper().textToBuffer(
        input,
        options.textToBufferCharset
      );
    }
    if (bufferConverter().typeEquals(input)) {
      return bufferConverter().toArrayBuffer(input, options);
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

  protected _getStartEnd(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(getStartEnd(options, input.byteLength));
  }

  protected _isEmpty(input: ArrayBuffer): boolean {
    return input.byteLength === 0;
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
    if (hasNoStartLength(options)) {
      return input;
    }
    const { start, end } = await this._getStartEnd(input, options);
    return input.slice(start, end);
  }

  protected async _toBase64(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return uint8ArrayConverter().toBase64(u8, options);
  }

  protected async _toText(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return textHelper().bufferToText(u8, options.bufferToTextCharset);
  }

  protected async _toUint8Array(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const ab = await this.toArrayBuffer(input, options);
    return isNode ? Buffer.from(ab) : new Uint8Array(ab);
  }
}

export const INSTANCE = new ArrayBufferConverter();
