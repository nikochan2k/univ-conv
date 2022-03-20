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

export type ReturnType<T extends Type> = T extends "arraybuffer"
  ? ArrayBuffer
  : T extends "uint8array"
  ? Uint8Array
  : T extends "buffer"
  ? Buffer
  : T extends "blob"
  ? Blob
  : T extends "readable"
  ? Readable
  : T extends "readblestream"
  ? ReadableStream<unknown>
  : string;
