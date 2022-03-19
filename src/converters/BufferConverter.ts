import {
  BLOB_CONVERTER,
  EMPTY_BUFFER,
  READABLE_CONVERTER,
  READABLE_STREAM_CONVERTER,
  UINT8_ARRAY_CONVERTER,
} from ".";
import { AbstractConverter, ConvertOptions } from "./Converter";

class BufferConverter extends AbstractConverter<Buffer> {
  public is(input: unknown): input is Buffer {
    return (
      input instanceof Buffer || toString.call(input) === "[object Buffer]"
    );
  }

  protected async _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<Buffer | undefined> {
    const chunkSize = options.chunkSize;

    if (typeof input === "string") {
      const encoding = options?.encoding;
      if (encoding === "Base64") {
        return Buffer.from(input, "base64");
      } else if (encoding === "BinaryString") {
        return Buffer.from(input, "binary");
      } else {
        return Buffer.from(input, "utf8");
      }
    }
    if (UINT8_ARRAY_CONVERTER.is(input)) {
      return Buffer.from(input.buffer, input.byteOffset, input.byteLength);
    }

    let ab: ArrayBuffer | undefined;
    if (BLOB_CONVERTER.is(input)) {
      ab = await BLOB_CONVERTER.toArrayBuffer(input, chunkSize);
    } else if (READABLE_CONVERTER.is(input)) {
      ab = await READABLE_CONVERTER.toArrayBuffer(input, chunkSize);
    } else if (READABLE_STREAM_CONVERTER.is(input)) {
      ab = await READABLE_STREAM_CONVERTER.toArrayBuffer(input, chunkSize);
    }
    if (ab) {
      return Buffer.from(ab);
    }

    return undefined;
  }

  protected _isEmpty(input: Buffer): boolean {
    return 0 === input.byteLength;
  }

  protected _merge(chunks: Buffer[]): Promise<Buffer> {
    return Promise.resolve(Buffer.concat(chunks));
  }

  protected async _toArrayBuffer(
    input: Buffer,
    chunkSize: number
  ): Promise<ArrayBuffer> {
    return UINT8_ARRAY_CONVERTER.toArrayBuffer(input, chunkSize);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toBase64(input: Buffer, _: number): Promise<string> {
    return Promise.resolve(input.toString("base64"));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toText(input: Buffer, _: number): Promise<string> {
    return Promise.resolve(input.toString("utf8"));
  }

  protected _toUint8Array(input: Buffer): Promise<Uint8Array> {
    return Promise.resolve(input);
  }

  protected empty(): Buffer {
    return EMPTY_BUFFER;
  }
}

export const BUFFER_CONVERTER = new BufferConverter();
