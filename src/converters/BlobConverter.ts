import {
  arrayBufferConverter,
  base64Converter,
  readableStreamConverter,
  uint8ArrayConverter,
} from "./converters";
import {
  AbstractConverter,
  ConvertOptions,
  EMPTY_UINT8_ARRAY,
  Data,
  Options,
} from "./core";
import { textHelper } from "./TextHelper";
import {
  dataUrlToBase64,
  EMPTY_BLOB,
  handleFileReader,
  handleReadableStream,
  hasArrayBufferOnBlob,
  hasReadAsArrayBufferOnBlob,
  hasStreamOnBlob,
  hasTextOnBlob,
} from "./util";

class BlobConverter extends AbstractConverter<Blob> {
  public typeEquals(input: unknown): input is Blob {
    return (
      input instanceof Blob ||
      toString.call(input) === "[object Blob]" ||
      toString.call(input) === "[object File]"
    );
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<Blob | undefined> {
    if (this.typeEquals(input)) {
      return input;
    }

    if (readableStreamConverter().typeEquals(input)) {
      const blobs: Blob[] = [];
      await handleReadableStream(input, async (chunk) => {
        blobs.push(await this.convert(chunk));
      });
      return this.merge(blobs);
    }
    const u8 = await uint8ArrayConverter().convert(input, options);
    if (u8) {
      return new Blob([u8]);
    }

    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _getSize(input: Blob, _: Options): Promise<number> {
    return Promise.resolve(input.size);
  }

  protected _isEmpty(input: Blob): boolean {
    return input.size === 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _merge(chunks: Blob[], _: Options): Promise<Blob> {
    return Promise.resolve(new Blob(chunks));
  }

  protected async _toArrayBuffer(
    input: Blob,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this._toUint8Array(input, options);
    return arrayBufferConverter().toArrayBuffer(u8, options);
  }

  protected async _toBase64(
    input: Blob,
    options: ConvertOptions
  ): Promise<string> {
    const bufferSize = options.bufferSize;
    const chunks: string[] = [];
    for (let start = 0, end = input.size; start < end; start += bufferSize) {
      const blobChunk = input.slice(start, start + bufferSize);
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
    options: ConvertOptions
  ): Promise<string> {
    if (options.srcCharset === "utf8") {
      if (hasTextOnBlob) {
        return input.text();
      }
      return handleFileReader(
        (reader) => reader.readAsText(input),
        (data) => data as string
      );
    }
    const u8 = await this.toUint8Array(input, options);
    return textHelper().bufferToText(u8, options.srcCharset);
  }

  protected async _toUint8Array(
    input: Blob,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    if (input.size === 0) {
      return EMPTY_UINT8_ARRAY;
    }

    if (hasArrayBufferOnBlob) {
      const ab = await input.arrayBuffer();
      return new Uint8Array(ab);
    }

    const bufferSize = options.bufferSize;
    if (hasReadAsArrayBufferOnBlob) {
      let byteLength = 0;
      const chunks: ArrayBuffer[] = [];
      for (let start = 0, end = input.size; start < end; start += bufferSize) {
        const blobChunk = input.slice(start, start + bufferSize);
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
      const converter = uint8ArrayConverter();
      const readable = input.stream() as unknown as ReadableStream<unknown>;
      const chunks: Uint8Array[] = [];
      await handleReadableStream(readable, async (chunk) => {
        const u8 = await converter.convert(chunk, {
          bufferSize: options.bufferSize,
        });
        chunks.push(u8);
      });
      return converter.merge(chunks);
    } else {
      const chunks: string[] = [];
      for (let start = 0, end = input.size; start < end; start += bufferSize) {
        const blobChunk = input.slice(start, start + bufferSize);
        const chunk: string = await handleFileReader(
          (reader) => reader.readAsDataURL(blobChunk),
          (data) => dataUrlToBase64(data as string)
        );
        chunks.push(chunk);
      }
      const base64 = chunks.join("");
      return base64Converter().toUint8Array(base64, options);
    }
  }

  protected empty(): Blob {
    return EMPTY_BLOB;
  }
}

export const INSTANCE = new BlobConverter();
