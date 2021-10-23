import { Readable, Writable } from "stream";

export type StreamSource = ReadableStream<any> | Readable;
export type StreamDestination = WritableStream<any> | Writable;
export type BinarySource = ArrayBuffer | Uint8Array | Buffer | Blob;
export type StringEncoding = "Base64" | "BinaryString";
export interface StringSource {
  encoding: StringEncoding;
  value: string;
}
export type Source = BinarySource | StringSource | StreamSource | string;
export type SourceType =
  | "ArrayBuffer"
  | "Uint8Array"
  | "Buffer"
  | "Blob"
  | "Base64"
  | "BinaryString"
  | "Text";
