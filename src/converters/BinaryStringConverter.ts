import {
  ARRAY_BUFFER_CONVERTER,
  BLOB_CONVERTER,
  hasBuffer,
  hasReadAsBinaryStringOnBlob,
  UINT8_ARRAY_CONVERTER,
} from ".";
import {
  AbstractConverter,
  ConvertOptions,
  Encoding,
  handleFileReader,
} from "./Converter";
import { ENCODER } from "./Encoder";

class BinaryStringConverter extends AbstractConverter<string> {
  public async _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<string | undefined> {
    if (typeof input === "string") {
      if (options.inputEncoding === "binary") {
        return input;
      }
    } else if (BLOB_CONVERTER.is(input)) {
      if (hasReadAsBinaryStringOnBlob) {
        const chunkSize = options.chunkSize;
        const chunks: string[] = [];
        for (let start = 0, end = input.size; start < end; start += chunkSize) {
          const blobChunk = input.slice(start, start + chunkSize);
          const chunk: string = await handleFileReader(
            (reader) => reader.readAsBinaryString(blobChunk),
            (data) => data as string
          );
          chunks.push(chunk);
        }
        return chunks.join("");
      }
    }
    const u8 = await UINT8_ARRAY_CONVERTER.convert(input, options);
    if (u8) {
      return Array.from(u8, (e) => String.fromCharCode(e)).join("");
    }

    return undefined;
  }

  public is(input: unknown): input is string {
    return typeof input === "string";
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  protected _merge(chunks: string[]): Promise<string> {
    return Promise.resolve(chunks.join(""));
  }

  protected async _toArrayBuffer(
    input: string,
    chunkSize: number
  ): Promise<ArrayBuffer> {
    const u8 = await this._toUint8Array(input, chunkSize);
    return ARRAY_BUFFER_CONVERTER.toArrayBuffer(u8, chunkSize);
  }

  protected async _toBase64(input: string, chunkSize: number): Promise<string> {
    const u8 = await this._toUint8Array(input, chunkSize);
    return UINT8_ARRAY_CONVERTER.toBase64(u8, chunkSize);
  }

  protected async _toText(
    input: string,
    inputEncoding: Encoding,
    chunkSize: number
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, chunkSize);
    return ENCODER.toText(u8, inputEncoding);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toUint8Array(input: string, _: number): Promise<Uint8Array> {
    if (hasBuffer) {
      return Promise.resolve(Buffer.from(input, "binary"));
    } else {
      return Promise.resolve(
        Uint8Array.from(input.split(""), (e) => e.charCodeAt(0))
      );
    }
  }

  protected empty(): string {
    return "";
  }
}

export const BINARY_STRING_CONVERTER = new BinaryStringConverter();
