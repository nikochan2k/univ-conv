export type CommonStringEncoding = "Base64";
export interface CommonStringData {
  encoding: CommonStringEncoding;
  value: string;
}

export type CommonBinaryData = ArrayBuffer | Uint8Array;
export type CommonBlockData = string | CommonBinaryData | CommonStringData;
export type CommonData = CommonBlockData;

export type CommonBinaryType = "ArrayBuffer" | "Uint8Array";
export type CommonStringType = "Base64" | "UTF8";
export type CommonBlockType = CommonBinaryType | CommonStringType;

export type CommonReturnDataType<T extends CommonBlockType> =
  T extends "ArrayBuffer"
    ? ArrayBuffer
    : T extends "Uint8Array"
    ? Uint8Array
    : T extends "Base64"
    ? string
    : T extends "UTF8"
    ? string
    : never;
