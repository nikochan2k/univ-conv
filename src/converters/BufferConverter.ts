import {
  BLOB_CONVERTER,
  EMPTY_ARRAY_BUFFER,
  EMPTY_BUFFER,
  READABLE_CONVERTER,
  READABLE_STREAM_CONVERTER,
  UINT8_ARRAY_CONVERTER,
} from ".";
import { Converter, ConvertOptions, initOptions, typeOf } from "./Converter";
import { EMPTY_UINT8_ARRAY } from "./Uint8ArrayConverter";

class BufferConverter implements Converter<Buffer> {
  public async convert(
    input: unknown,
    options?: ConvertOptions
  ): Promise<Buffer> {
    if (!input) {
      return EMPTY_BUFFER;
    }
    if (this.is(input)) {
      return input;
    }

    options = initOptions(options);
    const chunkSize = options.chunkSize as number;

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
      ab = await BLOB_CONVERTER.toUint8Array(input, chunkSize);
    } else if (READABLE_CONVERTER.is(input)) {
      ab = await READABLE_CONVERTER.toUint8Array(input, chunkSize);
    } else if (READABLE_STREAM_CONVERTER.is(input)) {
      ab = await READABLE_STREAM_CONVERTER.toUint8Array(input, chunkSize);
    }
    if (ab) {
      return Buffer.from(ab);
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal input: " + typeOf(input));
  }

  public is(input: unknown): input is Buffer {
    return (
      input instanceof Buffer || toString.call(input) === "[object Buffer]"
    );
  }

  public merge(chunks: Buffer[]): Promise<Buffer> {
    if (chunks.length === 0) {
      return Promise.resolve(EMPTY_BUFFER);
    }
    if (chunks.length === 1) {
      return Promise.resolve(chunks[0] as Buffer);
    }

    return Promise.resolve(Buffer.concat(chunks));
  }

  public async toArrayBuffer(
    input: Buffer,
    chunkSize: number
  ): Promise<ArrayBuffer> {
    if (!input) {
      return EMPTY_ARRAY_BUFFER;
    }

    return UINT8_ARRAY_CONVERTER.toArrayBuffer(input, chunkSize);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toBase64(input: Buffer, _: number): Promise<string> {
    if (!input) {
      return Promise.resolve("");
    }

    return Promise.resolve(input.toString("base64"));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toText(input: Buffer, _: number): Promise<string> {
    if (!input) {
      return Promise.resolve("");
    }

    return Promise.resolve(input.toString("utf8"));
  }

  public toUint8Array(input: Buffer): Promise<Uint8Array> {
    if (!input) {
      return Promise.resolve(EMPTY_UINT8_ARRAY);
    }

    return Promise.resolve(input);
  }
}

export const BUFFER_CONVERTER = new BufferConverter();
