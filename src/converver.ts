import { Readable } from "stream";
import {
  EMPTY_ARRAY_BUFFER,
  EMPTY_BASE64,
  EMPTY_BINARY_STRING,
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
  isArrayBuffer,
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
  binaryStringToUint8Array,
  blobToBase64,
  blobToBinaryString,
  blobToUint8Array,
  bufferToBase64,
  bufferToBinaryString,
  closeStream,
  DEFAULT_BUFFER_SIZE,
  handleFileReader,
  handleReadableStream,
  handleReadableStreamData,
  textToUint8Array,
  uint8ArrayToBinaryString,
  uint8ArrayToBuffer,
  uint8ArrayToText,
} from "./common";
import {
  BinaryData,
  Data,
  DataType,
  ReadableStreamData,
  ReturnDataType,
  StringData,
  WritableStreamData,
} from "./def";
import {
  mergeArrayBuffer,
  mergeBlob,
  mergeBuffer,
  mergeReadables,
  mergeReadableStream,
  mergeString,
  mergeStringData,
  mergeUint8Array,
} from "./merge";

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

  public async convert<T extends DataType>(
    data: Data,
    type: T
  ): Promise<ReturnDataType<T>> {
    let converted: Promise<Data>;
    switch (type) {
      case "ArrayBuffer":
        converted = converter.toArrayBuffer(data);
        break;
      case "Uint8Array":
        converted = converter.toUint8Array(data);
        break;
      case "Buffer":
        converted = converter.toBuffer(data);
        break;
      case "Blob":
        converted = converter.toBlob(data);
        break;
      case "Readable":
        converted = converter.toReadable(data);
        break;
      case "ReadableStream":
        converted = converter.toReadableStream(data);
        break;
      case "Base64":
        converted = converter.toBase64(data);
        break;
      case "BinaryString":
        converted = converter.toBinaryString(data);
        break;
      case "UTF8":
        converted = converter.toText(data);
        break;
      default:
        throw new TypeError(`Illegal DataType: ${type}`);
    }
    return converted as Promise<ReturnDataType<T>>;
  }

  public async convertAll<T extends DataType>(
    chunks: Data[],
    type: T
  ): Promise<ReturnDataType<T>[]> {
    const results: ReturnDataType<T>[] = [];
    for (const chunk of chunks) {
      const converted = await this.convert(chunk, type);
      results.push(converted);
    }
    return results;
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
      const u8 = textToUint8Array(data);
      return u8.byteLength;
    }
    if (isStringData(data)) {
      const value = data.value;
      const encoding = data.encoding;
      switch (encoding) {
        case "BinaryString":
          return value.length;
        case "Base64": {
          const len = value.length;
          const baseLen = (len * 3) / 4;
          let padding = 0;
          for (let i = len - 1; value[i] === "="; i--) {
            padding++;
          }
          return baseLen - padding;
        }
      }
    }
    return data.byteLength;
  }

  public async merge<T extends DataType>(
    chunks: Data[],
    type: T
  ): Promise<ReturnDataType<T>> {
    const results = await this.convertAll(
      chunks,
      type === "Base64" ? "Uint8Array" : type
    );
    let converted: Data;
    switch (type) {
      case "ArrayBuffer":
        converted = mergeArrayBuffer(results as ArrayBuffer[]);
        break;
      case "Uint8Array":
        converted = mergeUint8Array(results as Uint8Array[]);
        break;
      case "Buffer":
        converted = mergeBuffer(results as Buffer[]);
        break;
      case "Blob":
        converted = mergeBlob(results as Blob[]);
        break;
      case "Readable":
        converted = mergeReadables(results as Readable[]);
        break;
      case "ReadableStream":
        converted = mergeReadableStream(results as ReadableStream<unknown>[]);
        break;
      case "Base64":
        converted = mergeArrayBuffer(results as ArrayBuffer[]);
        converted = await this.toBase64(converted);
        break;
      case "BinaryString":
        converted = mergeStringData(results as unknown as StringData[], type);
        break;
      case "UTF8":
        converted = mergeString(results as string[]);
        break;
      default:
        throw new TypeError(`Illegal DataType: ${type}`);
    }
    return converted as ReturnDataType<T>;
  }

  public async pipe(input: Data, output: WritableStreamData) {
    if (isWritable(output)) {
      const readable = await this.toReadable(input);
      await new Promise<void>((resolve, reject) => {
        const onError = (err: Error) => {
          reject(err);
          readable.destroy();
          output.destroy();
          readable.removeAllListeners();
          output.removeAllListeners();
        };
        readable.once("error", onError);
        output.once("error", onError);
        output.once("finish", () => {
          resolve();
        });
        readable.pipe(output);
      });
    } else {
      let stream: ReadableStream | undefined;
      try {
        stream = await this.toReadableStream(input);
        if (typeof stream.pipeTo === "function") {
          await stream.pipeTo(output);
        } else {
          const writer = output.getWriter();
          await handleReadableStream(stream, (chunk) => writer.write(chunk));
        }
      } finally {
        closeStream(output);
        closeStream(stream);
      }
    }
  }

  public async toArrayBuffer(data: Data): Promise<ArrayBuffer> {
    if (!data) {
      return EMPTY_ARRAY_BUFFER;
    }

    if (isBlob(data)) {
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
      return data.buffer.slice(
        data.byteOffset,
        data.byteOffset + data.byteLength
      );
    }

    return data;
  }

  public async toBase64(data: Data): Promise<StringData> {
    if (!data) {
      return EMPTY_BASE64;
    }

    if (isReadableStreamData(data)) {
      const binary = await this._streamToBinaryData(data);
      return this.toBase64(binary);
    }
    if (isBuffer(data)) {
      return { encoding: "Base64", value: bufferToBase64(data) };
    }
    if (isStringData(data) && data.encoding === "Base64") {
      return data;
    }

    const buffer = await this.toArrayBuffer(data);
    return { encoding: "Base64", value: arrayBufferToBase64(buffer) };
  }

  public toBinaryData(data: Data): Promise<BinaryData> {
    if (isNode) {
      return this.toBuffer(data);
    } else if (isBrowser) {
      return this.toBlob(data);
    } else {
      return this.toUint8Array(data);
    }
  }

  public async toBinaryString(data: Data): Promise<StringData> {
    if (!data) {
      return EMPTY_BINARY_STRING;
    }

    if (isBlob(data)) {
      if (hasReadAsBinaryStringOnBlob) {
        const value = await blobToBinaryString(data);
        return { encoding: "BinaryString", value };
      } else if (hasStreamOnBlob) {
        data = data.stream() as unknown as ReadableStream<unknown>;
      } else if (hasArrayBufferOnBlob) {
        data = await data.arrayBuffer();
      }
    }
    if (isReadableStreamData(data)) {
      const binary = await this._streamToBinaryData(data);
      return this.toBinaryString(binary);
    }
    if (isBuffer(data)) {
      const value = bufferToBinaryString(data);
      return { encoding: "BinaryString", value };
    }
    if (isStringData(data) && data.encoding === "BinaryString") {
      return data;
    }

    const u8 = await this.toUint8Array(data);
    const value = uint8ArrayToBinaryString(u8);
    return { encoding: "BinaryString", value };
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
    if (typeof data === "string" || isUint8Array(data) || isArrayBuffer(data)) {
      return new Blob([data]);
    }
    if (isReadableStreamData(data)) {
      return this._streamToBlob(data);
    }

    const ab = await this.toUint8Array(data);
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
    if (typeof data === "string") {
      data = await this.toUint8Array(data);
    }
    if (isUint8Array(data)) {
      return uint8ArrayToBuffer(data);
    }
    if (isBlob(data) && hasStreamOnBlob) {
      data = data.stream() as unknown as ReadableStream<unknown>;
    }
    if (isReadableStreamData(data)) {
      const chunks: Buffer[] = [];
      await handleReadableStreamData(data, async (chunk) => {
        chunks.push(await this.toBuffer(chunk as Data));
      });
      return mergeBuffer(chunks);
    }
    if (isStringData(data)) {
      const value = data.value;
      return data.encoding === "Base64"
        ? base64ToBuffer(value)
        : binaryStringToBuffer(value);
    }

    data = await this.toArrayBuffer(data);
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
    if (isBlob(data) && hasStreamOnBlob) {
      data = data.stream() as unknown as ReadableStream<unknown>;
    }
    if (isReadableStream(data)) {
      const stream = data;
      const reader = data.getReader();
      return new Readable({
        read() {
          reader
            .read()
            .then(({ value, done }) => {
              if (value) {
                this.push(value);
              }
              if (done) {
                this.push(null);
                reader.releaseLock();
                reader.cancel().catch((e) => console.warn(e));
              }
            })
            .catch((e) => {
              reader.releaseLock();
              reader.cancel(e).catch((e) => console.warn(e));
            })
            .finally(() => {
              stream.cancel().catch((e) => console.warn(e));
            });
        },
      });
    }

    const buffer = await this.toBuffer(data);
    return Readable.from(buffer);
  }

  public async toReadableStream(data: Data): Promise<ReadableStream<unknown>> {
    if (!hasReadableStream) {
      throw new Error("ReadableStream is not supported");
    }
    if (!data) {
      return EMPTY_READABLE_STREAM;
    }

    if (isBlob(data) && hasStreamOnBlob) {
      data = data.stream() as unknown as ReadableStream<unknown>;
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
          readable.once("error", (err) => {
            converter.error(err);
            readable.destroy();
            readable.removeAllListeners();
          });
          readable.once("end", () => {
            converter.close();
            readable.removeAllListeners();
          });
          readable.on("data", (chunk) => converter.enqueue(chunk));
        },
        cancel: (err) => {
          readable.destroy(err as Error);
          readable.removeAllListeners();
        },
      });
    }

    const bufferSize = this.bufferSize;
    if (isBrowser) {
      const blob = await this.toBlob(data);
      if (hasStreamOnBlob) {
        return blob.stream() as unknown as ReadableStream<unknown>;
      }
      const size = blob.size;
      let start = 0;
      return new ReadableStream({
        start: async (converter) => {
          do {
            const chunk = await new Promise<unknown>((resolve, reject) => {
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
          const chunk = await new Promise<unknown>((resolve, reject) => {
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
    return isNode ? this.toReadable(data) : this.toReadableStream(data);
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
        (data) => data as string
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
      }
      if (hasStreamOnBlob) {
        data = data.stream() as unknown as ReadableStream<unknown>;
      } else {
        data = {
          value: await blobToBase64(data),
          encoding: "Base64",
        };
      }
    }
    if (isReadableStreamData(data)) {
      return this._streamToUint8Array(data);
    }
    if (typeof data === "string") {
      return textToUint8Array(data);
    }
    if (isStringData(data)) {
      const value = data.value;
      if (!value) {
        return EMPTY_U8;
      }
      const encoding = data.encoding;
      if (encoding === "Base64") {
        if (isNode) {
          return base64ToBuffer(value);
        } else {
          data = base64ToArrayBuffer(value);
        }
      } else {
        if (isNode) {
          return binaryStringToBuffer(value);
        } else {
          return binaryStringToUint8Array(value);
        }
      }
    }
    if (isNode) {
      return this.toBuffer(data);
    }
    return new Uint8Array(data);
  }

  private async _streamToBinaryData(readable: ReadableStreamData) {
    if (isBrowser) {
      return this._streamToBlob(readable);
    } else {
      return this._streamToUint8Array(readable);
    }
  }

  private async _streamToBlob(readable: ReadableStreamData) {
    const blobs: Blob[] = [];
    await handleReadableStreamData(readable, async (chunk) => {
      blobs.push(await this.toBlob(chunk as Data));
    });
    return mergeBlob(blobs);
  }

  private async _streamToUint8Array(readable: ReadableStreamData) {
    const chunks: Uint8Array[] = [];
    await handleReadableStreamData(readable, async (chunk) => {
      const u8 = await this.toUint8Array(chunk as Data);
      chunks.push(u8);
    });
    return mergeUint8Array(chunks);
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
