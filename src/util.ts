import { Readable, Writable } from "stream";
import { ReadableStreamData, StringData, StringEncoding } from "./def";

export const EMPTY_ARRAY_BUFFER = new ArrayBuffer(0);
export const EMPTY_U8 = new Uint8Array(0);

export let EMPTY_BUFFER: Buffer;
export let hasBuffer = false;
try {
  EMPTY_BUFFER = Buffer.from([]);
  hasBuffer = true;
} catch {}

export let EMPTY_BLOB: Blob;
export let hasBlob = false;
try {
  EMPTY_BLOB = new Blob([]);
  hasBlob = true;
} catch {}

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
} catch {}

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
} catch {}

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

export function isBuffer(data: any): data is Buffer {
  return (
    hasBuffer &&
    (data instanceof Buffer || toString.call(data) === "[object Buffer]")
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

export function isReadableStreamData(data: any): data is ReadableStreamData {
  return isReadable(data) || isReadableStream(data);
}

export function isStringData(data: any): data is StringData {
  if (data == null) {
    return false;
  }
  if (typeof data.value !== "string") {
    return false;
  }
  const encoding = data.encoding as StringEncoding;
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

export function handleFileReader<T extends string | ArrayBuffer>(
  trigger: (reader: FileReader) => void,
  transform: (data: any) => any
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = function (ev) {
      reject(reader.error || ev);
    };
    reader.onload = function () {
      resolve(transform(reader.result));
    };
    trigger(reader);
  });
}

export async function handleReadableStream(
  stream: ReadableStream,
  onData: (chunk: any) => Promise<void>
): Promise<void> {
  const reader = stream.getReader();
  try {
    let res = await reader.read();
    while (!res.done) {
      const chunk = res.value;
      if (chunk != null) {
        await onData(chunk);
      }
      res = await reader.read();
    }
    reader.cancel();
  } catch (err) {
    reader.cancel(err);
    throw err;
  }
}

export async function handleReadable(
  readable: Readable,
  onData: (chunk: any) => Promise<void>
): Promise<void> {
  if (readable.destroyed) {
    return;
  }
  return new Promise<void>((resolve, reject) => {
    readable.on("error", (e) => reject(e));
    readable.on("end", () => resolve());
    readable.on("data", (chunk) => onData(chunk));
  });
}

export async function handleReadableStreamData(
  data: ReadableStreamData,
  onData: (chunk: any) => Promise<void>
): Promise<void> {
  if (isReadableStream(data)) {
    return handleReadableStream(data, onData);
  } else {
    return handleReadable(data, onData);
  }
}
