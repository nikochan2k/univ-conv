import {
  BrowserBinaryData,
  BrowserBinaryType,
  BrowserData,
  BrowserReadableData,
  BrowserReturnDataType,
  BrowserStringEncoding,
  BrowserStringType,
  BrowserWritable,
} from "./def-browser";
import {
  CommonBinaryData,
  CommonBinaryType,
  CommonData,
  CommonReturnDataType,
  CommonStringEncoding,
  CommonStringType,
} from "./def-common";
import {
  NodeBinaryData,
  NodeBinaryType,
  NodeData,
  NodeReadableData,
  NodeReturnDataType,
  NodeWritable,
} from "./def-node";

export type StringEncoding = CommonStringEncoding | BrowserStringEncoding;
export interface StringData {
  encoding: StringEncoding;
  value: string;
}

export type BinaryData = CommonBinaryData | NodeBinaryData | BrowserBinaryData;
export type BlockData = string | BinaryData | StringData;
export type ReadableStreamData = NodeReadableData | BrowserReadableData;
export type Data = CommonData | NodeData | BrowserData;

export type BinaryType = CommonBinaryType | NodeBinaryType | BrowserBinaryType;
export type StringType = CommonStringType | BrowserStringType;
export type BlockType = BinaryType | StringType;
export type ReadableType = NodeReadableData | BrowserReadableData;
export type DataType = BlockType | ReadableType;

export type ReturnDataType<T extends DataType> =
  | CommonReturnDataType
  | NodeReturnDataType
  | BrowserReturnDataType;

export type WritableStreamData = NodeWritable | BrowserWritable;
