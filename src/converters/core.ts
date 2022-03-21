import type { Readable } from "stream";

export type Charset = "utf8" | "utf16le" | "utf16be" | "jis" | "eucjp" | "sjis";
export type StringType = "text" | "base64" | "binary" | "hex";
export type BinaryType = "arraybuffer" | "uint8array" | "buffer" | "blob";
export type BlockType = StringType | BinaryType;
export type StreamType = "readable" | "readablestream";
export type Type = BlockType | StreamType;

export type InputType =
  | string
  | ArrayBuffer
  | Uint8Array
  | Buffer
  | Blob
  | Readable
  | ReadableStream<unknown>;

export interface Options {
  chunkSize: number;
  inputCharset: Charset;
  inputEncoding: StringType;
  outputCharset: Charset;
}
export interface ConvertOptions extends Options {
  length?: number;
  start?: number;
}

export interface Converter<T extends InputType> {
  convert(input: InputType, options?: Partial<ConvertOptions>): Promise<T>;
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
export abstract class AbstractConverter<T extends InputType>
  implements Converter<T>
{
  public async convert(
    input: InputType,
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

    return this._merge(
      chunks,
      this._initOptions(chunks[0] as InputType, options)
    );
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

  public abstract typeEquals(input: InputType): input is T;

  protected abstract _convert(
    input: InputType,
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
    input: InputType,
    options?: Partial<ConvertOptions>
  ): ConvertOptions {
    if (!options) options = {};
    if (options.chunkSize == null) options.chunkSize = DEFAULT_BUFFER_SIZE;
    const rem = options.chunkSize % 6;
    if (rem !== 0) {
      options.chunkSize -= rem;
      console.info(
        `"bufferSize" was modified to ${options.chunkSize}. ("bufferSize" must be divisible by 6.)`
      );
    }
    if (typeof input === "string") {
      if (!options.inputEncoding) options.inputEncoding = "text";
    }
    if (!options.inputCharset) options.inputCharset = "utf8";
    if (!options.outputCharset) options.outputCharset = "utf8";
    return options as T;
  }
}
