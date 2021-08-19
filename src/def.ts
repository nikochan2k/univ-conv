export type BinarySource = ArrayBuffer | Uint8Array | Buffer | Blob;
export type StringEncoding = "Base64" | "Text" | "BinaryString";
export interface StringSource {
  encoding: StringEncoding;
  value: string;
}
export type Source = BinarySource | StringSource;
export type SourceType =
  | "ArrayBuffer"
  | "Uint8Array"
  | "Buffer"
  | "Blob"
  | "Base64"
  | "BinaryString"
  | "Text";
