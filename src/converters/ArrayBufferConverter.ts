import {
  BASE64_CONVERTER,
  BINARY_STRING_CONVERTER,
  BLOB_CONVERTER,
  READABLE_CONVERTER,
  READABLE_STREAM_CONVERTER,
  UINT8_ARRAY_CONVERTER,
  UTF8_CONVERTER,
} from ".";
import {
  AbstractConverter,
  ConvertOptions,
  EMPTY_ARRAY_BUFFER,
  Options,
} from "./Converter";

class ArrayBufferConverter extends AbstractConverter<ArrayBuffer> {
  public async _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<ArrayBuffer | undefined> {
    const chunkSize = options.chunkSize;

    if (typeof input === "string") {
      const encoding = options?.encoding;
      if (!encoding || encoding === "UTF8") {
        return UTF8_CONVERTER.toArrayBuffer(input, chunkSize);
      } else if (encoding === "BinaryString") {
        return BINARY_STRING_CONVERTER.toArrayBuffer(input, chunkSize);
      } else if (encoding === "Base64" || BASE64_CONVERTER.is(input)) {
        return BASE64_CONVERTER.toArrayBuffer(input, chunkSize);
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

    return undefined;
  }

  public is(input: unknown): input is ArrayBuffer {
    return (
      input instanceof ArrayBuffer ||
      toString.call(input) === "[object ArrayBuffer]"
    );
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
    const u8 = await this.toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toBase64(u8, chunkSize);
  }

  protected async _toText(
    input: ArrayBuffer,
    chunkSize: number
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toText(u8, chunkSize);
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
