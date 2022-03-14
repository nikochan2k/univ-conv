import {
  ARRAY_BUFFER_CONVERTER,
  BLOB_CONVERTER,
  BUFFER_CONVERTER,
  READABLE_CONVERTER,
} from ".";
import { Converter, ConvertOptions, initOptions, typeOf } from "./Converter";
import {
  EMPTY_UINT8_ARRAY,
  UINT8_ARRAY_CONVERTER,
} from "./Uint8ArrayConverter";

const textEncoder = new TextEncoder();

class UTF8Converter implements Converter<string> {
  public async convert(
    input: unknown,
    options?: ConvertOptions
  ): Promise<string> {
    if (!input) {
      return "";
    }
    if (typeof input === "string") {
      return input;
    }

    options = initOptions(options);
    const chunkSize = options.chunkSize as number;

    if (typeof input === "string") {
      return this.toText(input, chunkSize);
    }
    if (ARRAY_BUFFER_CONVERTER.is(input)) {
      return ARRAY_BUFFER_CONVERTER.toText(input, chunkSize);
    }
    if (UINT8_ARRAY_CONVERTER.is(input)) {
      return UINT8_ARRAY_CONVERTER.toText(input, chunkSize);
    }
    if (BLOB_CONVERTER.is(input)) {
      return BLOB_CONVERTER.toText(input, chunkSize);
    }
    if (BUFFER_CONVERTER.is(input)) {
      return BUFFER_CONVERTER.toText(input, chunkSize);
    }
    if (READABLE_CONVERTER.is(input)) {
      return READABLE_CONVERTER.toText(input, chunkSize);
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal input: " + typeOf(input));
  }

  public is(input: unknown): input is string {
    return typeof input === "string";
  }

  public merge(chunks: string[]): Promise<string> {
    return Promise.resolve(chunks.join(""));
  }

  public async toArrayBuffer(
    input: string,
    chunkSize: number
  ): Promise<ArrayBuffer> {
    const u8 = await this.toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toArrayBuffer(u8, chunkSize);
  }

  public async toBase64(input: string, chunkSize: number): Promise<string> {
    if (!input) {
      return "";
    }

    const u8 = await this.toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toBase64(u8, chunkSize);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toText(input: string, _: number): Promise<string> {
    return Promise.resolve(input);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toUint8Array(input: string, _: number): Promise<Uint8Array> {
    if (!input) {
      return Promise.resolve(EMPTY_UINT8_ARRAY);
    }

    return Promise.resolve(textEncoder.encode(input));
  }
}

export const UTF8_CONVERTER = new UTF8Converter();
