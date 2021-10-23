import { Readable, Writable } from "stream";
import { StringEncoding, StringSource } from "./def";

export const hasReadableStream = typeof ReadableStream === "function";
export const hasWritableStream = typeof WritableStream === "function";
export const hasBuffer = typeof Buffer === "function";
export const hasBlob = typeof Blob === "function";
export const hasReadable = typeof Readable === "function";
export const hasWritable = typeof Writable === "function";

export function isBlob(src: unknown): src is Blob {
  return (
    hasBlob && (src instanceof Blob || toString.call(src) === "[object Blob]")
  );
}

export function isArrayBuffer(src: unknown): src is ArrayBuffer {
  return (
    src instanceof ArrayBuffer || toString.call(src) === "[object ArrayBuffer]"
  );
}

export function isUint8Array(src: unknown): src is Uint8Array {
  return (
    src instanceof Uint8Array ||
    toString.call(src) === "[object Uint8Array]" ||
    isBuffer(src)
  );
}

export function isReadableStream(stream: any): stream is ReadableStream<any> {
  return (
    hasReadableStream &&
    stream &&
    typeof stream.getReader === "function" &&
    typeof stream.cancel === "function"
  );
}

export function isWritableStream(stream: any): stream is WritableStream<any> {
  return (
    hasWritableStream &&
    stream &&
    typeof stream.getWriter === "function" &&
    typeof stream.close === "function"
  );
}

export function isBuffer(src: any): src is Buffer {
  return (
    hasBuffer &&
    (src instanceof Buffer || toString.call(src) === "[object Buffer]")
  );
}

export function isReadable(stream: any): stream is Readable {
  return (
    stream &&
    hasReadable &&
    typeof stream.pipe === "function" &&
    typeof stream._read === "function"
  );
}

export function isWritable(stream: any): stream is Writable {
  return (
    stream &&
    hasWritable &&
    typeof stream.pipe === "function" &&
    typeof stream._write === "function"
  );
}

export function isStringSource(src: any): src is StringSource {
  if (src == null) {
    return false;
  }
  if (typeof src.value !== "string") {
    return false;
  }
  const encoding = src.encoding as StringEncoding;
  return encoding === "Base64" || encoding === "BinaryString";
}

export let hasTextOnBlob = false;
export let hasStreamOnBlob = false;
export let hasArrayBufferOnBlob = false;
export let hasReadAsArrayBuferOnBlob = false;
export let hasReadAsBinaryStringOnBlob = false;
if (hasBlob) {
  if (Blob.prototype.text != null) {
    hasTextOnBlob = true;
  }
  if (Blob.prototype.stream != null) {
    hasStreamOnBlob = true;
  }
  if (Blob.prototype.arrayBuffer != null) {
    hasArrayBufferOnBlob = true;
  }
  if (navigator?.product !== "ReactNative") {
    hasReadAsArrayBuferOnBlob = FileReader.prototype.readAsArrayBuffer != null;
    hasReadAsBinaryStringOnBlob =
      FileReader.prototype.readAsBinaryString != null;
  }
}

export const isBrowser = () =>
  ![typeof window, typeof document].includes("undefined");
