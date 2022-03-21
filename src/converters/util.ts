import type { Readable, Writable } from "stream";
import { EMPTY_UINT8_ARRAY, InputType } from "./core";

export let hasBlob = false;
export let hasTextOnBlob = false;
export let hasStreamOnBlob = false;
export let hasArrayBufferOnBlob = false;
export let hasReadAsArrayBufferOnBlob = false;
export let hasReadAsBinaryStringOnBlob = false;
export let EMPTY_BLOB: Blob;
if (typeof Blob === "function") {
  hasBlob = true;
  EMPTY_BLOB = new Blob([]);
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
    hasReadAsArrayBufferOnBlob = FileReader.prototype.readAsArrayBuffer != null;
    hasReadAsBinaryStringOnBlob =
      FileReader.prototype.readAsBinaryString != null;
  }
}

export let hasReadableStream = false;
export let hasWritableStream = false;
export let EMPTY_READABLE_STREAM: ReadableStream<unknown>;
if (typeof ReadableStream === "function") {
  hasReadableStream = true;
  hasWritableStream = true;
  EMPTY_READABLE_STREAM = EMPTY_READABLE_STREAM = new ReadableStream({
    start: (converter) => {
      if (hasBlob) {
        converter.enqueue(EMPTY_BLOB);
      } else {
        converter.enqueue(EMPTY_UINT8_ARRAY);
      }
      converter.close();
    },
  });
}

export let hasBuffer = false;
export let EMPTY_BUFFER: Buffer;
if (typeof Buffer === "function") {
  hasBuffer = true;
  EMPTY_BUFFER = Buffer.alloc(0);
}

/* eslint-disable */
let stream: any;
try {
  stream = require("stream");
} catch {}
/* eslint-enable */

export let hasReadable = false;
export let hasWritable = false;
export let EMPTY_READABLE: Readable;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (typeof stream?.Readable === "function") {
  hasReadable = true;
  hasWritable = true;
  /* eslint-disable */
  EMPTY_READABLE = EMPTY_READABLE = new stream.Readable({
    read() {
      this.push(EMPTY_BUFFER);
      this.push(null);
    },
  });
  /* eslint-enable */
}

export function handleFileReader<T extends string | ArrayBuffer>(
  trigger: (reader: FileReader) => void,
  transform: (data: string | ArrayBuffer | null) => T
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
  onData: (chunk: InputType) => Promise<void> | void
): Promise<void> {
  const reader = stream.getReader();
  try {
    let res = await reader.read();
    while (!res.done) {
      const chunk = res.value as InputType;
      if (chunk != null) {
        await onData(chunk);
      }
      res = await reader.read();
    }
    reader.cancel().catch((e) => console.debug(e));
  } catch (err) {
    reader.cancel(err).catch((e) => console.debug(e));
    throw err;
  } finally {
    reader.releaseLock();
    stream.cancel().catch((e) => console.debug(e));
  }
}

export function isReadableStream(
  stream: unknown
): stream is ReadableStream<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (
    hasWritableStream &&
    stream != null &&
    typeof (stream as WritableStream<unknown>).getWriter === "function" &&
    typeof (stream as WritableStream<unknown>).close === "function"
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

export function closeStream(
  stream:
    | Readable
    | Writable
    | ReadableStream<unknown>
    | WritableStream<unknown>
    | undefined,
  reason?: unknown
) {
  if (!stream) {
    return;
  }

  if (isReadable(stream) || isWritable(stream)) {
    stream.destroy(reason as Error | undefined);
  } else if (isReadableStream(stream)) {
    const reader = stream.getReader();
    reader.releaseLock();
    reader
      .cancel()
      .catch((e) => console.warn(e))
      .finally(() => {
        // stream.cancel(reason).catch((e) => console.warn(e));
      });
  } else if (isWritableStream(stream)) {
    const writer = stream.getWriter();
    writer.releaseLock();
    writer
      .close()
      .catch((e) => console.warn(e))
      .finally(() => {
        stream.close().catch((e) => console.warn(e));
      });
  }
}

export function dataUrlToBase64(dataUrl: string) {
  const index = dataUrl.indexOf(",");
  if (0 <= index) {
    return dataUrl.substring(index + 1);
  }
  return dataUrl;
}
