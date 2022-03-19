import { Readable } from "stream";
import {
  isBlob,
  isReadable,
  isReadableStream,
  isStringData,
  isUint8Array,
  isWritable,
} from "./check";
import {
  ARRAY_BUFFER_CONVERTER,
  BLOB_CONVERTER,
  BUFFER_CONVERTER,
  READABLE_CONVERTER,
  UINT8_ARRAY_CONVERTER,
} from "./converters";
import {
  closeStream,
  handleReadableStream,
  textToUint8Array,
} from "./converters/common";
import { ConvertOptions } from "./converters/Converter";
import {
  Data,
  DataType,
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
    input: unknown,
    options?: ConvertOptions
  ): Promise<ReturnDataType<T>> {
    if (ARRAY_BUFFER_CONVERTER.is(input)) {
      return ARRAY_BUFFER_CONVERTER.convert(input, options);
    }
    if (UINT8_ARRAY_CONVERTER.is(input)) {
      return UINT8_ARRAY_CONVERTER.convert(input, options);
    }
    if (BUFFER_CONVERTER.is(input)) {
      return BUFFER_CONVERTER.convert(input, options);
    }
    if (BLOB_CONVERTER.is(input)) {
      return BLOB_CONVERTER.convert(input, options);
    }
    if (READABLE_CONVERTER.is(input)) {
      return READABLE_CONVERTER.convert(input, options);
    }

    throw new Error("Illegal input: " + typeOf(input));
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
}

export const converter = new Converter();
