export type BinarySource = ArrayBuffer | Uint8Array | Buffer | Blob;
export type EncodingType = "Base64" | "Text" | "BinaryString";
export interface StringSource {
  encoding: EncodingType;
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
