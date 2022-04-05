import type { Readable } from "stream";
import { hasBlob, isBrowser, toFileURL } from "./util";

export type Charset = "utf8" | "utf16le" | "utf16be" | "jis" | "eucjp" | "sjis";
export type URLType = "file" | "data" | "blob";
export type StringType = "text" | "url" | "base64" | "binary" | "hex";
export type BinaryType = "arraybuffer" | "uint8array" | "buffer" | "blob";
export type BlockType = StringType | BinaryType;
export type StreamType = "readable" | "readablestream";
export type DataType = BlockType | StreamType;

export type Data =
  | string
  | ArrayBuffer
  | Uint8Array
  | Buffer
  | Blob
  | Readable
  | ReadableStream<unknown>;

export interface Options {
  bufferSize: number;
  srcStringType: StringType;
  srcCharset: Charset;
  dstCharset: Charset;
  dstURLType: URLType;
}
export interface ConvertOptions extends Options {
  length?: number;
  start?: number;
}

export interface Converter<T extends Data> {
  convert(input: Data, options?: Partial<ConvertOptions>): Promise<T>;
  getSize(input: T, options?: Partial<Options>): Promise<number>;
  merge(chunks: T[], options?: Partial<Options>): Promise<T>;
  toArrayBuffer(input: T, options: ConvertOptions): Promise<ArrayBuffer>;
  toBase64(input: T, options: ConvertOptions): Promise<string>;
  toText(input: T, options: ConvertOptions): Promise<string>;
  toUint8Array(input: T, options: ConvertOptions): Promise<Uint8Array>;
  typeEquals(input: unknown): input is T;
}

export function typeOf(input: unknown): string {
  const type = typeof input;
  if (type === "function" || type === "object") {
    // eslint-disable-next-line
    return (input as any)?.constructor?.name || String.toString.call(input);
  }
  return type;
}

export const DEFAULT_BUFFER_SIZE = 96 * 1024;
export const EMPTY_ARRAY_BUFFER = new ArrayBuffer(0);
export const EMPTY_UINT8_ARRAY = new Uint8Array(0);
export abstract class AbstractConverter<T extends Data>
  implements Converter<T>
{
  public async convert(
    input: Data,
    options?: Partial<ConvertOptions>
  ): Promise<T> {
    if (!input) {
      return this.empty();
    }

    const converted = await this._convert(
      input,
      this._initOptions(input, options)
    );
    if (typeof converted !== "undefined") {
      return converted;
    }

    throw new Error(
      `[${this.constructor.name}] Illegal input: ${typeOf(input)}`
    );
  }

  public getSize(input: T, options?: Partial<Options>): Promise<number> {
    return this._getSize(input, this._initOptions(input, options));
  }

  public merge(chunks: T[], options?: Partial<Options>): Promise<T> {
    if (!chunks || chunks.length === 0) {
      return Promise.resolve(this.empty());
    }
    if (chunks.length === 1) {
      return Promise.resolve(chunks[0] as T);
    }

    return this._merge(chunks, this._initOptions(chunks[0] as Data, options));
  }

  public toArrayBuffer(
    input: T,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    if (!input || this._isEmpty(input)) {
      return Promise.resolve(EMPTY_ARRAY_BUFFER);
    }
    return this._toArrayBuffer(input, options);
  }

  public toBase64(input: T, options: ConvertOptions): Promise<string> {
    if (!input || this._isEmpty(input)) {
      return Promise.resolve("");
    }
    return this._toBase64(input, options);
  }

  public toText(input: T, options: ConvertOptions): Promise<string> {
    if (!input || this._isEmpty(input)) {
      return Promise.resolve("");
    }
    return this._toText(input, options);
  }

  public toUint8Array(input: T, options: ConvertOptions): Promise<Uint8Array> {
    if (!input || this._isEmpty(input)) {
      return Promise.resolve(EMPTY_UINT8_ARRAY);
    }
    return this._toUint8Array(input, options);
  }

  public abstract typeEquals(input: Data): input is T;

  protected abstract _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<T | undefined>;
  protected abstract _getSize(input: T, options: Options): Promise<number>;
  protected abstract _isEmpty(input: T): boolean;
  protected abstract _merge(chunks: T[], options: Options): Promise<T>;
  protected abstract _toArrayBuffer(
    input: T,
    options: ConvertOptions
  ): Promise<ArrayBuffer>;
  protected abstract _toBase64(
    input: T,
    options: ConvertOptions
  ): Promise<string>;
  protected abstract _toText(
    input: T,
    options: ConvertOptions
  ): Promise<string>;
  protected abstract _toUint8Array(
    input: T,
    options: ConvertOptions
  ): Promise<Uint8Array>;
  protected abstract empty(): T;

  private _initOptions<T extends Options>(
    input: Data,
    options?: Partial<ConvertOptions>
  ): ConvertOptions {
    if (!options) options = {};
    if (options.bufferSize == null) options.bufferSize = DEFAULT_BUFFER_SIZE;
    const rem = options.bufferSize % 6;
    if (rem !== 0) {
      options.bufferSize -= rem;
      console.info(
        `"bufferSize" was modified to ${options.bufferSize}. ("bufferSize" must be divisible by 6.)`
      );
    }
    if (typeof input === "string") {
      if (!options.srcStringType) options.srcStringType = "text";
    }
    if (!options.srcCharset) options.srcCharset = "utf8";
    if (!options.dstCharset) options.dstCharset = "utf8";
    if (options.dstURLType === "file") {
      if (!toFileURL) {
        throw new Error("File URL is not supported");
      }
    } else if (options.dstURLType === "blob") {
      if (!hasBlob || typeof URL?.createObjectURL !== "function") {
        throw new Error("Blob URL is not supported");
      }
    } else if (options.dstURLType === "data") {
      // Do nothing
    } else {
      if (toFileURL) {
        options.dstURLType = "file";
      } else if (isBrowser) {
        options.dstURLType = "blob";
      } else {
        options.dstURLType = "data";
      }
    }
    return options as T;
  }
}
