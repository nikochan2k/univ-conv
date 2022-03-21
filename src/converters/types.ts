import type { Readable } from "stream";

export type CharsetType =
  | "utf8"
  | "utf16le"
  | "utf16be"
  | "jis"
  | "eucjp"
  | "sjis";
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
  inputEncoding: StringType;
  inputCharset: CharsetType;
  outputCharset: CharsetType;
}
export interface ConvertOptions extends Options {
  length?: number;
  start?: number;
}

export interface Converter<T extends InputType> {
  convert(input: InputType, options?: Partial<ConvertOptions>): Promise<T>;
  merge(chunks: T[], options?: Partial<Options>): Promise<T>;
  toArrayBuffer(input: T, options: ConvertOptions): Promise<ArrayBuffer>;
  toBase64(input: T, options: ConvertOptions): Promise<string>;
  toText(input: T, options: ConvertOptions): Promise<string>;
  toUint8Array(input: T, options: ConvertOptions): Promise<Uint8Array>;
  typeEquals(input: unknown): input is T;
}
