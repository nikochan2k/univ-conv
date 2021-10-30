import { Readable } from "stream";
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
  isNode,
  isReadable,
  isReadableStream,
  isReadableStreamData,
  isStringData,
  isUint8Array,
  isWritable,
} from "./check";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  base64ToBuffer,
  binaryStringToBuffer,
  blobToBase64,
  blobToBinaryString,
  blobToUint8Array,
  bufferToBase64,
  bufferToBinaryString,
  DEFAULT_BUFFER_SIZE,
  handleFileReader,
  handleReadableStream,
  handleReadableStreamData,
  textToUint8Array,
  uint8ArrayToBinaryString,
  uint8ArrayToText,
} from "./common";
import {
  BinaryData,
  Data,
  ReadableStreamData,
  WritableStreamData,
} from "./def";

export interface ConverterOptions {
  bufferSize?: number;
}

export class Converter {
  public bufferSize: number;

  constructor(options?: ConverterOptions) {
    if (!options) {
      options = {};
    }
    this.bufferSize = this._validateBufferSize(options);
  }

  public async getSize(data: Data): Promise<number> {
    if (!data) {
      return 0;
    }

    if (isReadable(data) || isReadableStream(data)) {
      data = await this.toUint8Array(data);
    }
    if (isUint8Array(data)) {
      return data.byteLength;
    }
    if (isBlob(data)) {
      return data.size;
    }
    if (typeof data === "string") {
      const u8 = await textToUint8Array(data);
      return u8.byteLength;
    }
    if (isStringData(data)) {
      const value = data.value;
      const encoding = data.encoding;
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
    return data.byteLength;
  }

  public async pipe(input: Data, output: WritableStreamData) {
    if (isWritable(output)) {
      const readable = await this.toReadable(input);
      await new Promise<void>((resolve, reject) => {
        readable.on("error", (err) => reject(err));
        output.on("error", (err) => reject(err));
        output.on("finish", () => resolve());
        readable.pipe(output);
      });
    } else {
      const stream = await this.toReadableStream(input);
      if (typeof stream.pipeTo === "function") {
        await stream.pipeTo(output);
      } else {
        const writer = output.getWriter();
        await handleReadableStream(stream, async (chunk) => {
          await writer.write(chunk);
        });
        await writer.close();
      }
    }
  }

  public async toArrayBuffer(data: Data): Promise<ArrayBuffer> {
    if (!data) {
      return EMPTY_ARRAY_BUFFER;
    }

    if (isBlob(data)) {
      if (data.size === 0) {
        return EMPTY_ARRAY_BUFFER;
      }
      if (hasArrayBufferOnBlob) {
        return data.arrayBuffer();
      }
      data = await this.toUint8Array(data);
    } else if (
      typeof data === "string" ||
      isStringData(data) ||
      isReadable(data) ||
      isReadableStream(data)
    ) {
      data = await this.toUint8Array(data);
    }
    if (isUint8Array(data)) {
      if (data.byteLength === 0) {
        return EMPTY_ARRAY_BUFFER;
      }
      return data.buffer.slice(
        data.byteOffset,
        data.byteOffset + data.byteLength
      );
    }

    return data;
  }

  public async toBase64(data: Data): Promise<string> {
    if (!data) {
      return "";
    }

    if (isReadableStreamData(data)) {
      const binary = await this._streamToBinaryData(data);
      return this.toBase64(binary);
    }

    const bufferSize = this.bufferSize;
    if (isBuffer(data)) {
      const chunks: string[] = [];
      const end = data.byteLength;
      for (let start = 0; start < end; start += bufferSize) {
        const buf = data.slice(start, bufferSize);
        const chunk = await bufferToBase64(buf);
        chunks.push(chunk);
      }
      return chunks.join("");
    }
    if (isStringData(data)) {
      const value = data.value;
      if (!value) {
        return "";
      }

      const encoding = data.encoding;
      if (encoding === "Base64") {
        return value;
      }
    }

    const u8 = await this.toUint8Array(data);
    const chunks: string[] = [];
    for (let start = 0, end = u8.byteLength; start < end; start += bufferSize) {
      const sliced = u8.slice(start, bufferSize);
      const buf = await this.toArrayBuffer(sliced);
      const chunk = await arrayBufferToBase64(buf);
      chunks.push(chunk);
    }
    return chunks.join("");
  }

  public toBinaryData(data: Data): Promise<BinaryData> {
    if (isBrowser) {
      return this.toBlob(data);
    } else if (isNode) {
      return this.toBuffer(data);
    } else {
      return this.toUint8Array(data);
    }
  }

  public async toBinaryString(data: Data): Promise<string> {
    if (!data) {
      return "";
    }

    if (isReadableStreamData(data)) {
      const binary = await this._streamToBinaryData(data);
      return this.toBinaryString(binary);
    }

    const bufferSize = this.bufferSize;
    if (isBuffer(data)) {
      const chunks: string[] = [];
      const end = data.byteLength;
      for (let start = 0; start < end; start += bufferSize) {
        const buf = data.slice(start, start + bufferSize);
        const chunk = await bufferToBinaryString(buf);
        chunks.push(chunk);
      }
      return chunks.join("");
    }
    if (isBlob(data)) {
      if (hasReadAsBinaryStringOnBlob) {
        return blobToBinaryString(data);
      } else if (hasArrayBufferOnBlob) {
        data = await data.arrayBuffer();
      }
    }
    if (isStringData(data)) {
      const value = data.value;
      if (!value) {
        return "";
      }
      if (data.encoding === "BinaryString") {
        return value;
      }
    }

    const u8 = await this.toUint8Array(data);
    const chunks: string[] = [];
    for (let start = 0, end = u8.byteLength; start < end; start += bufferSize) {
      const u8Chunk = u8.slice(start, start + bufferSize);
      const chunk = await uint8ArrayToBinaryString(u8Chunk);
      chunks.push(chunk);
    }
    return chunks.join("");
  }

  public async toBlob(data: Data): Promise<Blob> {
    if (!hasBlob) {
      throw new Error("Blob is not supported");
    }
    if (!data) {
      return EMPTY_BLOB;
    }
    if (isBlob(data)) {
      return data;
    }

    if (isReadableStreamData(data)) {
      return this._streamToBlob(data);
    }

    const ab = await this.toArrayBuffer(data);
    return new Blob([ab]);
  }

  public async toBuffer(data: Data): Promise<Buffer> {
    if (!hasBuffer) {
      throw new Error("Buffer is not suppoted.");
    }
    if (!data) {
      return EMPTY_BUFFER;
    }
    if (isBuffer(data)) {
      return data;
    }

    if (isReadableStreamData(data)) {
      const buffers: Buffer[] = [];
      await handleReadableStreamData(data, async (chunk: any) => {
        buffers.push(await this.toBuffer(chunk));
      });
      if (buffers.length === 1) {
        return buffers[0]!;
      }
      return Buffer.concat(buffers);
    }

    if (isUint8Array(data)) {
      if (data.byteLength === 0) {
        return EMPTY_BUFFER;
      }
      return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    }
    if (isBlob(data)) {
      if (data.size === 0) {
        return EMPTY_BUFFER;
      }
      return Buffer.from(await this.toArrayBuffer(data));
    }
    if (typeof data === "string") {
      const u8 = await textToUint8Array(data);
      return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
    }
    if (isStringData(data)) {
      const encoding = data.encoding;
      const value = data.value;
      const end = value.length;
      const bufferSize = this.bufferSize;
      let byteLength = 0;
      const chunks: Buffer[] = [];
      for (let start = 0; start < end; start += bufferSize) {
        const str = value.slice(start, start + bufferSize);
        const chunk = await (encoding === "Base64"
          ? base64ToBuffer(str)
          : binaryStringToBuffer(str));
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

    return Buffer.from(data);
  }

  public async toReadable(data: Data): Promise<Readable> {
    if (!hasReadable) {
      throw new Error("Readable is not supported");
    }
    if (!data) {
      return EMPTY_READABLE;
    }
    if (isReadable(data)) {
      return data;
    }

    if (isReadableStream(data)) {
      const reader = data.getReader();
      return new Readable({
        read() {
          reader
            .read()
            .then(({ value, done }) => {
              if (done) {
                this.push(null);
                reader.cancel();
              } else {
                this.push(value);
              }
            })
            .catch((e) => {
              reader.cancel(e);
            });
        },
      });
    }

    const buffer = await this.toBuffer(data);
    const bufferSize = this.bufferSize;
    const length = buffer.byteLength;
    let start = 0;
    return new Readable({
      read: async function () {
        do {
          const chunk = await new Promise<Buffer>((resolve, reject) => {
            try {
              const end = start + bufferSize;
              const sliced = buffer.slice(start, end);
              start += sliced.byteLength;
              resolve(sliced);
            } catch (err) {
              reject(err);
            }
          });
          this.push(chunk);
        } while (start < length);
        this.push(null);
      },
    });
  }

  public async toReadableStream(data: Data): Promise<ReadableStream<any>> {
    if (!hasReadableStream) {
      throw new Error("ReadableStream is not supported");
    }
    if (!data) {
      return EMPTY_READABLE_STREAM;
    }
    if (isReadableStream(data)) {
      return data;
    }

    if (isReadable(data)) {
      const readable = data;
      if (readable.destroyed) {
        return EMPTY_READABLE_STREAM;
      }
      return new ReadableStream({
        start: (converter) => {
          readable.on("error", (err) => converter.error(err));
          readable.on("end", () => converter.close());
          readable.on("data", (chunk) => converter.enqueue(chunk));
        },
        cancel: (err) => readable.destroy(err),
      });
    }
    if (isBlob(data)) {
      if (hasStreamOnBlob) {
        return data.stream() as any;
      }
    }

    const bufferSize = this.bufferSize;
    if (isBrowser) {
      const blob = await this.toBlob(data);
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

    const u8 = await this.toUint8Array(data);
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

  public toReadableStreamData(data: Data): Promise<ReadableStreamData> {
    if (isBrowser) {
      return this.toReadableStream(data);
    } else {
      return this.toReadable(data);
    }
  }

  public async toText(data: Data): Promise<string> {
    if (!data) {
      return "";
    }
    if (typeof data === "string") {
      return data;
    }

    if (isReadableStreamData(data)) {
      const binary = await this._streamToBinaryData(data);
      return this.toText(binary);
    }
    if (isBuffer(data)) {
      return data.toString("utf8");
    }
    if (isBlob(data)) {
      if (hasTextOnBlob) {
        return data.text();
      }
      return handleFileReader(
        (reader) => reader.readAsText(data),
        (data) => data
      );
    }

    const u8 = await this.toUint8Array(data);
    return uint8ArrayToText(u8);
  }

  public async toUint8Array(data: Data): Promise<Uint8Array> {
    if (!data) {
      return EMPTY_U8;
    }
    if (isUint8Array(data)) {
      return data;
    }

    if (isReadableStreamData(data)) {
      return this._streamToUint8Array(data);
    }
    if (isBlob(data)) {
      if (data.size === 0) {
        return EMPTY_U8;
      }
      if (hasArrayBufferOnBlob) {
        const ab = await data.arrayBuffer();
        return new Uint8Array(ab);
      }
      if (hasReadAsArrayBuferOnBlob) {
        return blobToUint8Array(data);
      } else {
        return this.toUint8Array({
          value: await blobToBase64(data),
          encoding: "Base64",
        });
      }
    }
    if (typeof data === "string") {
      return await textToUint8Array(data);
    }
    if (isStringData(data)) {
      const value = data.value;
      if (!value) {
        return EMPTY_U8;
      }

      const encoding = data.encoding;
      if (encoding === "Base64") {
        return new Uint8Array(await base64ToArrayBuffer(value));
      } else {
        return Uint8Array.from(value.split(""), (e) => e.charCodeAt(0));
      }
    }
    if (hasBuffer && !isBrowser) {
      return this.toBuffer(data);
    }
    return new Uint8Array(data);
  }

  public async _streamToBinaryData(readable: ReadableStreamData) {
    if (isBrowser) {
      return this._streamToBlob(readable);
    } else {
      return this._streamToUint8Array(readable);
    }
  }

  private async _streamToBlob(readable: ReadableStreamData) {
    const blobs: Blob[] = [];
    await handleReadableStreamData(readable, async (chunk: any) => {
      blobs.push(await this.toBlob(chunk));
    });
    if (blobs.length === 1) {
      return blobs[0]!;
    }
    return new Blob(blobs);
  }

  private async _streamToUint8Array(readable: ReadableStreamData) {
    const chunks: Uint8Array[] = [];
    let length = 0;
    await handleReadableStreamData(readable, async (chunk) => {
      const u8Chunk = await this.toUint8Array(chunk);
      chunks.push(u8Chunk);
      length += u8Chunk.byteLength;
    });
    const u8 = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      u8.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return u8;
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
