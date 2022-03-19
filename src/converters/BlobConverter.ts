import {
  ARRAY_BUFFER_CONVERTER,
  BASE64_CONVERTER,
  BINARY_STRING_CONVERTER,
  EMPTY_BLOB,
  EMPTY_UINT8_ARRAY,
  hasArrayBufferOnBlob,
  hasReadAsArrayBuferOnBlob as hasReadAsArrayBufferOnBlob,
  hasStreamOnBlob,
  hasTextOnBlob,
  READABLE_CONVERTER,
  READABLE_STREAM_CONVERTER,
  UINT8_ARRAY_CONVERTER,
} from ".";
import {
  AbstractConverter,
  ConvertOptions,
  dataUrlToBase64,
  DEFAULT_BUFFER_SIZE,
  handleFileReader,
  Encoding,
} from "./Converter";
import { ENCODER } from "./Encoder";
import { handleReadableStream } from "./ReadableStreamConverter";

class BlobConverter extends AbstractConverter<Blob> {
  public is(input: unknown): input is Blob {
    return (
      input instanceof Blob ||
      toString.call(input) === "[object Blob]" ||
      toString.call(input) === "[object File]"
    );
  }

  protected async _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<Blob | undefined> {
    const chunkSize = options.chunkSize;

    if (READABLE_STREAM_CONVERTER.is(input)) {
      const blobs: Blob[] = [];
      await handleReadableStream(input, async (chunk) => {
        blobs.push(await this.convert(chunk));
      });
      return this.merge(blobs);
    }
    if (typeof input === "string") {
      const inputEncoding = options.inputEncoding;
      if (inputEncoding === "base64") {
        input = BASE64_CONVERTER.toUint8Array(input, chunkSize);
      } else if (inputEncoding === "binary") {
        input = BINARY_STRING_CONVERTER.toUint8Array(input, chunkSize);
      } else {
        input = await ENCODER.toUint8Array(input, inputEncoding);
      }
    }
    if (READABLE_CONVERTER.is(input)) {
      input = await READABLE_CONVERTER.toUint8Array(input, chunkSize);
    }
    if (UINT8_ARRAY_CONVERTER.is(input)) {
      return new Blob([input]);
    }

    return undefined;
  }

  protected _isEmpty(input: Blob): boolean {
    return input.size === 0;
  }

  protected _merge(chunks: Blob[]): Promise<Blob> {
    return Promise.resolve(new Blob(chunks));
  }

  protected async _toArrayBuffer(
    input: Blob,
    chunkSize: number
  ): Promise<ArrayBuffer> {
    const u8 = await this._toUint8Array(input, chunkSize);
    return ARRAY_BUFFER_CONVERTER.toArrayBuffer(u8, chunkSize);
  }

  protected async _toBase64(input: Blob, chunkSize: number): Promise<string> {
    chunkSize = chunkSize ?? DEFAULT_BUFFER_SIZE;
    const chunks: string[] = [];
    for (let start = 0, end = input.size; start < end; start += chunkSize) {
      const blobChunk = input.slice(start, start + chunkSize);
      const chunk = await handleFileReader(
        (reader) => reader.readAsDataURL(blobChunk),
        (data) => dataUrlToBase64(data as string)
      );
      chunks.push(chunk);
    }
    return chunks.join("");
  }

  protected async _toText(
    input: Blob,
    inputEncoding: Encoding,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chunkSize: number
  ): Promise<string> {
    if (inputEncoding === "utf8" || inputEncoding === "utf-8") {
      if (hasTextOnBlob) {
        return input.text();
      }
      return handleFileReader(
        (reader) => reader.readAsText(input),
        (data) => data as string
      );
    }
    const u8 = await this.toUint8Array(input, chunkSize);
    return ENCODER.toText(u8, inputEncoding);
  }

  protected async _toUint8Array(
    input: Blob,
    chunkSize: number
  ): Promise<Uint8Array> {
    if (input.size === 0) {
      return EMPTY_UINT8_ARRAY;
    }

    chunkSize = chunkSize ?? DEFAULT_BUFFER_SIZE;
    if (hasArrayBufferOnBlob) {
      const ab = await input.arrayBuffer();
      return new Uint8Array(ab);
    }
    if (hasReadAsArrayBufferOnBlob) {
      let byteLength = 0;
      const chunks: ArrayBuffer[] = [];
      for (let start = 0, end = input.size; start < end; start += chunkSize) {
        const blobChunk = input.slice(start, start + chunkSize);
        const chunk = await handleFileReader(
          (reader) => reader.readAsArrayBuffer(blobChunk),
          (data) => {
            const chunk = data as ArrayBuffer;
            byteLength += chunk.byteLength;
            return chunk;
          }
        );
        chunks.push(chunk);
      }

      const u8 = new Uint8Array(byteLength);
      let pos = 0;
      for (const chunk of chunks) {
        u8.set(new Uint8Array(chunk), pos);
        pos += chunk.byteLength;
      }
      return u8;
    }
    if (hasStreamOnBlob) {
      const readable = input.stream() as unknown as ReadableStream<unknown>;
      const chunks: Uint8Array[] = [];
      await handleReadableStream(readable, async (chunk) => {
        const u8 = await UINT8_ARRAY_CONVERTER.convert(chunk);
        chunks.push(u8);
      });
      return UINT8_ARRAY_CONVERTER.merge(chunks);
    } else {
      const chunks: string[] = [];
      for (let start = 0, end = input.size; start < end; start += chunkSize) {
        const blobChunk = input.slice(start, start + chunkSize);
        const chunk: string = await handleFileReader(
          (reader) => reader.readAsDataURL(blobChunk),
          (data) => dataUrlToBase64(data as string)
        );
        chunks.push(chunk);
      }
      const base64 = chunks.join("");
      return BASE64_CONVERTER.toUint8Array(base64, chunkSize);
    }
  }

  protected empty(): Blob {
    return EMPTY_BLOB;
  }
}

export const Blob_CONVERTER = new BlobConverter();
