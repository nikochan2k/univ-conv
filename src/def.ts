import { Readable, Writable } from "stream";

export type StringEncoding = "Base64" | "BinaryString";
export interface StringData {
  encoding: StringEncoding;
  value: string;
}

export type BinaryData = ArrayBuffer | Uint8Array | Buffer | Blob;
export type BlockData = string | BinaryData | StringData;
export type ReadableStreamData = ReadableStream<any> | Readable;
export type Data = BlockData | ReadableStreamData;

export type BinaryType = "ArrayBuffer" | "Uint8Array" | "Buffer" | "Blob";
export type StringType = "Base64" | "BinaryString" | "Text";
export type BlockType = BinaryType | StringType;
export type ReadableStreamType = "ReadableStream" | "Readable";
export type Type = BlockType | ReadableStreamType;

export type WritableStreamData = WritableStream<any> | Writable;
