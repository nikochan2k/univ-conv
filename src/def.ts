import { Readable, Writable } from "stream";

export type StringEncoding = "Base64" | "BinaryString";
export interface StringSource {
  encoding: StringEncoding;
  value: string;
}

export type BinarySource = ArrayBuffer | Uint8Array | Buffer | Blob;
export type BlockSource = string | BinarySource | StringSource;
export type StreamSource = ReadableStream<any> | Readable;
export type Source = BlockSource | StreamSource;

export type BinarySourceType = "ArrayBuffer" | "Uint8Array" | "Buffer" | "Blob";
export type StringSourceType = "Base64" | "BinaryString" | "Text";
export type BlockSourceType = BinarySourceType | StringSourceType;
export type StreamSourceType = "ReadableStream" | "Readable";
export type SourceType = BlockSourceType | StreamSourceType;

export type StreamDestination = WritableStream<any> | Writable;
