import type { Readable, Writable } from "stream";

export type NodeBinaryData = Buffer;
export type NodeBlockData = NodeBinaryData;
export type NodeReadableData = Readable;
export type NodeData = NodeBlockData | NodeReadableData;

export type NodeBinaryType = "Buffer";
export type NodeReadableType = "Readable";
export type NodeDataType = NodeBinaryType | NodeReadableType;

export type NodeReturnDataType<T extends NodeDataType> =
  T extends NodeBinaryType
    ? Buffer
    : T extends NodeReadableType
    ? Readable
    : never;

export type NodeWritable = Writable;
