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
export type StringType = "Base64" | "BinaryString" | "UTF8";
export type BlockType = BinaryType | StringType;
export type ReadableStreamType = "ReadableStream" | "Readable";
export type DataType = BlockType | ReadableStreamType;

export type ReturnDataType<T extends DataType> = T extends "ArrayBuffer"
  ? ArrayBuffer
  : T extends "Uint8Array"
  ? Uint8Array
  : T extends "Buffer"
  ? Buffer
  : T extends "Blob"
  ? Blob
  : T extends "Base64"
  ? string
  : T extends "BinaryString"
  ? string
  : T extends "UTF8"
  ? string
  : T extends "ReadableStream"
  ? ReadableStream<any>
  : T extends "Readable"
  ? Readable
  : never;

export type WritableStreamData = WritableStream<any> | Writable;
