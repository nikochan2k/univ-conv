import { Writable } from "stream";

export type BrowserStringEncoding = "BinaryString";
export interface BrowserStringData {
  encoding: BrowserStringEncoding;
  value: string;
}
export type BrowserBinaryData = Blob;
export type BrowserBlockData = string | BrowserBinaryData;
export type BrowserReadableData = ReadableStream<unknown>;
export type BrowserData = BrowserBlockData | BrowserReadableData;

export type BrowserBinaryType = "Blob";
export type BrowserStringType = "BinaryString";
export type BrowserReadableType = "ReadableStream";
export type BrowserDataType =
  | BrowserBinaryType
  | BrowserStringType
  | BrowserReadableType;

export type BrowserReturnDataType<T extends BrowserDataType> =
  T extends BrowserBinaryType
    ? Blob
    : T extends BrowserStringType
    ? string
    : T extends BrowserReadableType
    ? ReadableStream<unknown>
    : never;

export type BrowserWritable = Writable;
