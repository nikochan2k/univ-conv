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
import { dataUrlToBase64, handleFileReader } from "./common";
import {
  Converter,
  ConvertOptions,
  DEFAULT_BUFFER_SIZE,
  initOptions,
  typeOf,
} from "./Converter";
import { handleReadableStream } from "./ReadableStreamConverter";

class BlobConverter implements Converter<Blob> {
  public async convert(
    input: unknown,
    options?: ConvertOptions
  ): Promise<Blob> {
    if (!input) {
      return EMPTY_BLOB;
    }
    if (this.is(input)) {
      return input;
    }

    options = initOptions(options);
    const chunkSize = options.chunkSize as number;

    if (typeof input === "string") {
      const encoding = options?.encoding;
      if (encoding === "Base64") {
        input = BASE64_CONVERTER.toUint8Array(input, chunkSize);
      } else if (encoding === "BinaryString") {
        input = BINARY_STRING_CONVERTER.toUint8Array(input, chunkSize);
      } else {
        return new Blob([input]);
      }
    }
    if (READABLE_STREAM_CONVERTER.is(input)) {
      const blobs: Blob[] = [];
      await handleReadableStream(input, async (chunk) => {
        blobs.push(await this.convert(chunk));
      });
      return this.merge(blobs);
    }
    if (READABLE_CONVERTER.is(input)) {
      input = await READABLE_CONVERTER.toUint8Array(input, chunkSize);
    }

    if (UINT8_ARRAY_CONVERTER.is(input)) {
      return new Blob([input as BlobPart]);
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal input: " + typeOf(input));
  }

  public is(input: unknown): input is Blob {
    return (
      input instanceof Blob ||
      toString.call(input) === "[object Blob]" ||
      toString.call(input) === "[object File]"
    );
  }

  public merge(chunks: Blob[]): Promise<Blob> {
    if (chunks.length === 0) {
      return Promise.resolve(EMPTY_BLOB);
    }
    if (chunks.length === 1) {
      return Promise.resolve(chunks[0] as Blob);
    }

    return Promise.resolve(new Blob(chunks));
  }

  public async toArrayBuffer(
    input: Blob,
    chunkSize: number
  ): Promise<ArrayBuffer> {
    if (hasArrayBufferOnBlob) {
      return input.arrayBuffer();
    }
    const u8 = await this.toUint8Array(input, chunkSize);
    return ARRAY_BUFFER_CONVERTER.toArrayBuffer(u8, chunkSize);
  }

  public async toBase64(input: Blob, chunkSize: number): Promise<string> {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toText(input: Blob, _: number): Promise<string> {
    if (hasTextOnBlob) {
      return input.text();
    }
    return handleFileReader(
      (reader) => reader.readAsText(input),
      (data) => data as string
    );
  }

  public async toUint8Array(
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
}

export const Blob_CONVERTER = new BlobConverter();
