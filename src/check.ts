import { Readable, Writable } from "stream";
import { ReadableStreamData, StringData } from "./def";

export const EMPTY_ARRAY_BUFFER = new ArrayBuffer(0);
export const EMPTY_U8 = new Uint8Array(0);

export let EMPTY_BUFFER: Buffer;
export let hasBuffer = false;
try {
  EMPTY_BUFFER = Buffer.from([]);
  hasBuffer = true;
} catch (e) {
  console.debug(e);
}

export let EMPTY_BLOB: Blob;
export let hasBlob = false;
try {
  EMPTY_BLOB = new Blob([]);
  hasBlob = true;
} catch (e) {
  console.debug(e);
}

export const EMPTY_BASE64: StringData = {
  encoding: "Base64",
  value: "",
};
export const EMPTY_BINARY_STRING: StringData = {
  encoding: "BinaryString",
  value: "",
};

export let EMPTY_READABLE_STREAM: ReadableStream;
export let hasReadableStream = false;
export let hasWritableStream = false;
try {
  EMPTY_READABLE_STREAM = new ReadableStream({
    start: (converter) => {
      if (hasBlob) {
        converter.enqueue(EMPTY_BLOB);
      } else {
        converter.enqueue(EMPTY_U8);
      }
      converter.close();
    },
  });
  hasReadableStream = true;
  hasWritableStream = true;
} catch (e) {
  console.debug(e);
}

export let EMPTY_READABLE: Readable;
export let hasReadable = false;
export let hasWritable = false;
try {
  EMPTY_READABLE = new Readable({
    read() {
      this.push(EMPTY_BUFFER);
      this.push(null);
    },
  });
  hasReadable = true;
  hasWritable = true;
} catch (e) {
  console.debug(e);
}

export function isBlob(data: unknown): data is Blob {
  return (
    hasBlob &&
    (data instanceof Blob ||
      toString.call(data) === "[object Blob]" ||
      toString.call(data) === "[object File]")
  );
}

export function isArrayBuffer(data: unknown): data is ArrayBuffer {
  return (
    data instanceof ArrayBuffer ||
    toString.call(data) === "[object ArrayBuffer]"
  );
}

export function isUint8Array(data: unknown): data is Uint8Array {
  return (
    data instanceof Uint8Array ||
    toString.call(data) === "[object Uint8Array]" ||
    isBuffer(data)
  );
}

export function isReadableStream(
  stream: unknown
): stream is ReadableStream<unknown> {
  return (
    hasReadableStream &&
    stream != null &&
    typeof (stream as ReadableStream<unknown>).getReader === "function" &&
    typeof (stream as ReadableStream<unknown>).cancel === "function"
  );
}

export function isWritableStream(
  stream: unknown
): stream is WritableStream<unknown> {
  return (
    hasWritableStream &&
    stream != null &&
    typeof (stream as WritableStream<unknown>).getWriter === "function" &&
    typeof (stream as WritableStream<unknown>).close === "function"
  );
}

export function isBuffer(data: unknown): data is Buffer {
  return (
    hasBuffer &&
    (data instanceof Buffer || toString.call(data) === "[object Buffer]")
  );
}

export function isReadable(stream: unknown): stream is Readable {
  return (
    hasReadable &&
    stream != null &&
    typeof (stream as Readable).pipe === "function" &&
    typeof (stream as Readable)._read === "function"
  );
}

export function isWritable(stream: unknown): stream is Writable {
  return (
    hasWritable &&
    stream != null &&
    typeof (stream as Writable).pipe === "function" &&
    typeof (stream as Writable)._write === "function"
  );
}

export function isReadableStreamData(
  data: unknown
): data is ReadableStreamData {
  return isReadable(data) || isReadableStream(data);
}

export function isStringData(data: unknown): data is StringData {
  if (data == null) {
    return false;
  }
  const sd = data as StringData;
  if (typeof sd.value !== "string") {
    return false;
  }
  const encoding = sd.encoding;
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

export const isBrowser = ![typeof window, typeof document].includes(
  "undefined"
);

export const isNode = !!(
  typeof process !== "undefined" &&
  process.versions &&
  process.versions.node
);
