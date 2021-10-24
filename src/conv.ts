import { decode, encode } from "base64-arraybuffer";
import { Readable } from "stream";
import { StreamDestination } from ".";
import {
  EMPTY_ARRAY_BUFFER,
  EMPTY_BLOB,
  EMPTY_BUFFER,
  EMPTY_READABLE,
  EMPTY_READABLE_STREAM,
  EMPTY_U8,
  hasArrayBufferOnBlob,
  hasBlob,
  hasBuffer,
  hasReadable,
  hasReadableStream,
  hasReadAsArrayBuferOnBlob,
  hasReadAsBinaryStringOnBlob,
  hasStreamOnBlob,
  hasTextOnBlob,
  isBlob,
  isBrowser,
  isBuffer,
  isReadable,
  isReadableStream,
  isStringSource,
  isUint8Array,
  isWritable,
} from "./check";
import { Source } from "./def";

export const DEFAULT_BUFFER_SIZE = 96 * 1024;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function dataUrlToBase64(dataUrl: string) {
  const index = dataUrl.indexOf(",");
  if (0 <= index) {
    return dataUrl.substr(index + 1);
  }
  return dataUrl;
}

export interface ConverterOptions {
  bufferSize?: number;
}

export class Converter {
  private bufferSize: number;

  constructor(options?: ConverterOptions) {
    if (!options) {
      options = {};
    }
    this.bufferSize = this._validateBufferSize(options);
  }

  public async getSize(src: Source) {
    if (!src) {
      return 0;
    }

    if (isReadable(src) || isReadableStream(src)) {
      src = await this.toUint8Array(src);
    }
    if (isUint8Array(src)) {
      return src.byteLength;
    }
    if (isBlob(src)) {
      return src.size;
    }
    if (typeof src === "string") {
      return this._textToUint8Array(src);
    }
    if (isStringSource(src)) {
      const value = src.value;
      const encoding = src.encoding;
      switch (encoding) {
        case "BinaryString":
          return value.length;
        case "Base64":
          const len = value.length;
          const baseLen = (len * 3) / 4;
          let padding = 0;
          for (let i = len - 1; value[i] === "="; i--) {
            padding++;
          }
          return baseLen - padding;
      }
    }
    return src.byteLength;
  }

  public async pipe(src: Source, writable: StreamDestination) {
    if (isWritable(writable)) {
      const readable = await this.toReadable(src);
      await new Promise<void>((resolve, reject) => {
        readable.on("error", (err) => reject(err));
        writable.on("error", (err) => reject(err));
        writable.on("finish", () => resolve());
        readable.pipe(writable);
      });
    } else {
      const readable = await this.toReadableStream(src);
      if (typeof readable.pipeTo === "function") {
        await readable.pipeTo(writable);
      } else {
        const reader = readable.getReader();
        const writer = writable.getWriter();
        let done = false;
        do {
          const result = await reader.read();
          if (result.value) {
            await writer.write(result.value);
          }
          done = result.done;
        } while (!done);
        await writer.close();
      }
    }
  }

  public async toArrayBuffer(src: Source): Promise<ArrayBuffer> {
    if (!src) {
      return EMPTY_ARRAY_BUFFER;
    }

    if (isBlob(src)) {
      if (src.size === 0) {
        return EMPTY_ARRAY_BUFFER;
      }
      if (hasArrayBufferOnBlob) {
        return src.arrayBuffer();
      }
      src = await this.toUint8Array(src);
    } else if (
      typeof src === "string" ||
      isStringSource(src) ||
      isReadable(src) ||
      isReadableStream(src)
    ) {
      src = await this.toUint8Array(src);
    }
    if (isUint8Array(src)) {
      if (src.byteLength === 0) {
        return EMPTY_ARRAY_BUFFER;
      }
      return src.buffer.slice(src.byteOffset, src.byteOffset + src.byteLength);
    }

    return src;
  }

  public async toBase64(src: Source): Promise<string> {
    const bufferSize = this.bufferSize;
    if (isBuffer(src)) {
      const chunks: string[] = [];
      const end = src.byteLength;
      for (let start = 0; start < end; start += bufferSize) {
        const buf = src.slice(start, bufferSize);
        const chunk = await this._bufferToBase64(buf);
        chunks.push(chunk);
      }
      return chunks.join("");
    }
    if (isStringSource(src)) {
      const value = src.value;
      if (!value) {
        return "";
      }

      const encoding = src.encoding;
      if (encoding === "Base64") {
        return value;
      }
    }

    const u8 = await this.toUint8Array(src);
    const chunks: string[] = [];
    for (let start = 0, end = u8.byteLength; start < end; start += bufferSize) {
      const sliced = u8.slice(start, bufferSize);
      const buf = await this.toArrayBuffer(sliced);
      const chunk = await this._arrayBufferToBase64(buf);
      chunks.push(chunk);
    }
    return chunks.join("");
  }

  public async toBinaryString(src: Source): Promise<string> {
    const bufferSize = this.bufferSize;
    if (isBuffer(src)) {
      const chunks: string[] = [];
      const end = src.byteLength;
      for (let start = 0; start < end; start += bufferSize) {
        const buf = src.slice(start, start + bufferSize);
        const chunk = await this._bufferToBinaryString(buf);
        chunks.push(chunk);
      }
      return chunks.join("");
    }
    if (isBlob(src)) {
      if (hasReadAsBinaryStringOnBlob) {
        return this._blobToBinaryString(src);
      } else if (hasArrayBufferOnBlob) {
        src = await src.arrayBuffer();
      }
    }
    if (isStringSource(src)) {
      const value = src.value;
      if (!value) {
        return "";
      }
      if (src.encoding === "BinaryString") {
        return value;
      }
    }

    const u8 = await this.toUint8Array(src);
    const chunks: string[] = [];
    for (let start = 0, end = u8.byteLength; start < end; start += bufferSize) {
      const u8Chunk = u8.slice(start, start + bufferSize);
      const chunk = await this._uint8ArrayToBinaryString(u8Chunk);
      chunks.push(chunk);
    }
    return chunks.join("");
  }

  public async toBlob(src: Source): Promise<Blob> {
    if (!hasBlob) {
      throw new Error("Blob is not supported");
    }

    if (!src) {
      return EMPTY_BLOB;
    }

    if (isBlob(src)) {
      return src;
    }
    const ab = await this.toArrayBuffer(src);
    return new Blob([ab]);
  }

  public async toBuffer(src: Source): Promise<Buffer> {
    if (!hasBuffer) {
      throw new Error("Buffer is not suppoted.");
    }

    if (!src) {
      return EMPTY_BUFFER;
    }

    if (isBuffer(src)) {
      return src;
    }
    if (isReadable(src)) {
      const readable = src;
      if (readable.destroyed) {
        return EMPTY_BUFFER;
      }
      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        readable.on("data", (chunk) => chunks.push(chunk));
        readable.on("end", () => resolve(Buffer.concat(chunks)));
        readable.on("error", (err) => reject(err));
      });
    }
    if (isReadableStream(src)) {
      src = await this.toUint8Array(src);
    }
    if (isUint8Array(src)) {
      if (src.byteLength === 0) {
        return EMPTY_BUFFER;
      }
      return Buffer.from(src.buffer, src.byteOffset, src.byteLength);
    }
    if (isBlob(src)) {
      if (src.size === 0) {
        return EMPTY_BUFFER;
      }
      return Buffer.from(await this.toArrayBuffer(src));
    }
    if (typeof src === "string") {
      const u8 = await this._textToUint8Array(src);
      return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
    }
    if (isStringSource(src)) {
      const encoding = src.encoding;
      const value = src.value;
      const end = value.length;
      const bufferSize = this.bufferSize;
      let byteLength = 0;
      const chunks: Buffer[] = [];
      for (let start = 0; start < end; start += bufferSize) {
        const str = value.slice(start, start + bufferSize);
        const chunk = await (encoding === "Base64"
          ? this._base64ToBuffer(str)
          : this._binaryStringToBuffer(str));
        byteLength += chunk.byteLength;
        chunks.push(chunk);
      }
      let offset = 0;
      const buffer = Buffer.alloc(byteLength);
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return buffer;
    }

    return Buffer.from(src);
  }

  public async toReadable(src: Source): Promise<Readable> {
    if (!hasReadable) {
      throw new Error("Readable is not supported");
    }
    if (!src) {
      return EMPTY_READABLE;
    }

    if (isReadable(src)) {
      return src;
    }
    if (isReadableStream(src)) {
      const reader = src.getReader();
      if (await reader.closed) {
        return EMPTY_READABLE;
      }
      return new Readable({
        read() {
          reader
            .read()
            .then(({ value, done }) => {
              this.push(done ? null : value);
            })
            .catch((e) => {
              this.emit("error", e);
              this.push(null);
            });
        },
      });
    }

    const buffer = await this.toBuffer(src);
    const bufferSize = this.bufferSize;
    const length = buffer.byteLength;
    let start = 0;
    return new Readable({
      read: async function () {
        do {
          const chunk = await new Promise<any>((resolve, reject) => {
            try {
              const end = start + bufferSize;
              const sliced = buffer.slice(start, end);
              start += sliced.byteLength;
              resolve(sliced);
            } catch (err) {
              this.push(null);
              reject(err);
            }
          });
          this.push(chunk);
        } while (start < length);
        this.push(null);
      },
    });
  }

  public async toReadableStream(src: Source): Promise<ReadableStream<any>> {
    if (!hasReadableStream) {
      throw new Error("ReadableStream is not supported");
    }
    if (!src) {
      return EMPTY_READABLE_STREAM;
    }

    if (isReadableStream(src)) {
      return src;
    }
    if (isReadable(src)) {
      const readable = src;
      if (readable.destroyed) {
        return EMPTY_READABLE_STREAM;
      }
      return new ReadableStream({
        start: (converter) => {
          readable.on("error", (err) => {
            throw err;
          });
          readable.on("data", (chunk) => converter.enqueue(chunk));
          readable.on("end", () => converter.close());
        },
        cancel: () => readable.destroy(),
      });
    }
    if (isBlob(src)) {
      if (hasStreamOnBlob) {
        return src.stream() as any;
      }
    }

    const bufferSize = this.bufferSize;
    if (hasBlob && isBrowser) {
      const blob = await this.toBlob(src);
      const size = blob.size;
      let start = 0;
      return new ReadableStream({
        start: async (converter) => {
          do {
            const chunk = await new Promise<any>((resolve, reject) => {
              try {
                const end = start + bufferSize;
                const sliced = blob.slice(start, end);
                start += sliced.size;
                resolve(sliced);
              } catch (err) {
                converter.close();
                reject(err);
              }
            });
            converter.enqueue(chunk);
          } while (start < size);
          converter.close();
        },
      });
    }

    const u8 = await this.toUint8Array(src);
    const length = u8.byteLength;
    let start = 0;
    return new ReadableStream({
      start: async (converter) => {
        do {
          const chunk = await new Promise<any>((resolve, reject) => {
            try {
              const end = start + bufferSize;
              const sliced = u8.slice(start, end);
              start += sliced.byteLength;
              resolve(sliced);
            } catch (err) {
              converter.close();
              reject(err);
            }
          });
          converter.enqueue(chunk);
        } while (start < length);
        converter.close();
      },
    });
  }

  public async toText(src: Source): Promise<string> {
    if (typeof src === "string") {
      return src;
    }
    if (isBuffer(src)) {
      return src.toString("utf8");
    }
    if (isBlob(src)) {
      if (hasTextOnBlob) {
        return src.text();
      }
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = function (ev) {
          reject(reader.error || ev);
        };
        reader.onload = function () {
          resolve(reader.result as string);
        };
        reader.readAsText(src);
      });
    }

    const u8 = await this.toUint8Array(src);
    return this._uint8ArrayToText(u8);
  }

  public async toUint8Array(src: Source): Promise<Uint8Array> {
    if (!src) {
      return EMPTY_U8;
    }

    if (isUint8Array(src)) {
      return src;
    }
    if (isBlob(src)) {
      if (src.size === 0) {
        return EMPTY_U8;
      }
      if (hasArrayBufferOnBlob) {
        const ab = await src.arrayBuffer();
        return new Uint8Array(ab);
      }
      if (hasReadAsArrayBuferOnBlob) {
        return this._blobToUint8Array(src);
      } else {
        return this.toUint8Array({
          value: await this._blobToBase64(src),
          encoding: "Base64",
        });
      }
    }
    if (isReadableStream(src)) {
      const reader = src.getReader();
      if (await reader.closed) {
        return EMPTY_U8;
      }
      const u8 = new Uint8Array(0);
      let offset = 0;
      let res = await reader.read();
      while (!res.done) {
        const chunk = await this.toUint8Array(res.value);
        u8.set(chunk, offset);
        offset += chunk.byteLength;
        res = await reader.read();
      }
      return u8;
    }
    if (isReadable(src)) {
      if (src.destroyed) {
        return EMPTY_U8;
      }
      return this.toBuffer(src);
    }
    if (typeof src === "string") {
      return await this._textToUint8Array(src);
    }
    if (isStringSource(src)) {
      const value = src.value;
      if (!value) {
        return EMPTY_U8;
      }

      const encoding = src.encoding;
      if (encoding === "Base64") {
        return new Uint8Array(await this._base64ToArrayBuffer(value));
      } else {
        return Uint8Array.from(value.split(""), (e) => e.charCodeAt(0));
      }
    }
    if (hasBuffer && !isBrowser) {
      return this.toBuffer(src);
    }
    return new Uint8Array(src);
  }

  protected async _arrayBufferToBase64(buffer: ArrayBuffer) {
    return encode(buffer);
  }

  protected async _base64ToArrayBuffer(base64: string) {
    return decode(base64);
  }

  protected async _base64ToBuffer(base64: string) {
    return Buffer.from(base64, "base64");
  }

  protected async _binaryStringToBuffer(bin: string) {
    return Buffer.from(bin, "binary");
  }

  protected async _blobToBase64(blob: Blob): Promise<string> {
    if (blob.size === 0) {
      return "";
    }

    const bufferSize = this.bufferSize;
    const chunks: string[] = [];
    for (let start = 0, end = blob.size; start < end; start += bufferSize) {
      const blobChunk = blob.slice(start, start + bufferSize);
      const chunk = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = function (ev) {
          reject(reader.error || ev);
        };
        reader.onload = function () {
          const base64 = dataUrlToBase64(reader.result as string);
          resolve(base64);
        };
        reader.readAsDataURL(blobChunk);
      });
      chunks.push(chunk);
    }
    return chunks.join("");
  }

  protected async _blobToBinaryString(blob: Blob): Promise<string> {
    if (blob.size === 0) {
      return "";
    }

    const bufferSize = this.bufferSize;
    const chunks: string[] = [];
    for (let start = 0, end = blob.size; start < end; start += bufferSize) {
      const blobChunk = blob.slice(start, start + bufferSize);
      const chunk = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = function (ev) {
          reject(reader.error || ev);
        };
        reader.onload = function () {
          resolve(reader.result as string);
        };
        reader.readAsBinaryString(blobChunk);
      });
      chunks.push(chunk);
    }
    return chunks.join("");
  }

  protected async _blobToUint8Array(blob: Blob) {
    if (blob.size === 0) {
      return EMPTY_U8;
    }

    const bufferSize = this.bufferSize;
    let byteLength = 0;
    const chunks: ArrayBuffer[] = [];
    for (let start = 0, end = blob.size; start < end; start += bufferSize) {
      const blobChunk = blob.slice(start, start + bufferSize);
      const chunk = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = (ev) => {
          reject(reader.error || ev);
        };
        reader.onload = () => {
          const chunk = reader.result as ArrayBuffer;
          byteLength += chunk.byteLength;
          resolve(chunk);
        };
        reader.readAsArrayBuffer(blobChunk);
      });
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

  protected async _bufferToBase64(buffer: Buffer) {
    return buffer.toString("base64");
  }

  protected async _bufferToBinaryString(buffer: Buffer) {
    return buffer.toString("binary");
  }

  protected async _uint8ArrayToBinaryString(u8: Uint8Array) {
    return Array.from(u8, (e) => String.fromCharCode(e)).join("");
  }

  protected async _uint8ArrayToText(u8: Uint8Array) {
    return textDecoder.decode(u8);
  }

  private async _textToUint8Array(text: string) {
    return textEncoder.encode(text);
  }

  private _validateBufferSize(options: { bufferSize?: number }) {
    if (!options.bufferSize) {
      options.bufferSize = DEFAULT_BUFFER_SIZE;
    }
    const rem = options.bufferSize % 6;
    if (rem !== 0) {
      options.bufferSize -= rem;
      console.info(
        `"bufferSize" was modified to ${options.bufferSize}. ("bufferSize" must be divisible by 6.)`
      );
    }
    return options.bufferSize;
  }
}

export const converter = new Converter();
