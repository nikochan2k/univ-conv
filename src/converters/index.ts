import type { Readable } from "stream";
import { Converter } from "./Converter";
import { FALSE_CONVERTER } from "./FalseConverter";
import { EMPTY_UINT8_ARRAY } from "./Uint8ArrayConverter";

export * from "./ArrayBufferConverter";
export * from "./Base64Converter";
export * from "./Uint8ArrayConverter";
export * from "./UTF8Converter";
export * from "./BinaryStringConverter";

export let hasBlob = false;
export let hasTextOnBlob = false;
export let hasStreamOnBlob = false;
export let hasArrayBufferOnBlob = false;
export let hasReadAsArrayBuferOnBlob = false;
export let hasReadAsBinaryStringOnBlob = false;
export const isBrowser = typeof window !== "undefined";
export let BLOB_CONVERTER: Converter<Blob>;
export let EMPTY_BLOB: Blob;
if (typeof Blob === "function") {
  hasBlob = true;
  /* eslint-disable */
  const bc = require("./BlobConverter");
  BLOB_CONVERTER = bc.BLOB_CONVERTER;
  EMPTY_BLOB = bc.EMPTY_BLOB;
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
  /* eslint-enablet */
} else {
  BLOB_CONVERTER = FALSE_CONVERTER;
}

export let hasReadableStream = false;
export let READABLE_STREAM_CONVERTER: Converter<ReadableStream<unknown>>;
export let EMPTY_READABLE_STREAM: ReadableStream<unknown>;
if (typeof ReadableStream === "function") {
  hasReadableStream = true;
  READABLE_STREAM_CONVERTER =
    require("./ReadableStreamConverter").READABLE_STREAM_CONVERTER;
  EMPTY_READABLE_STREAM = new ReadableStream({
    start: (converter) => {
      if (isBrowser) {
        converter.enqueue(EMPTY_BLOB);
      } else {
        converter.enqueue(EMPTY_UINT8_ARRAY);
      }
      converter.close();
    },
  });
} else {
  READABLE_STREAM_CONVERTER = FALSE_CONVERTER;
}

export let hasBuffer = false;
export let BUFFER_CONVERTER: Converter<Buffer>;
export let EMPTY_BUFFER: Buffer;
if (typeof Buffer === "function") {
  hasBuffer = true;
  /* eslint-disable */
  const bc = require("./BufferConverter");
  BUFFER_CONVERTER = bc.BUFFER_CONVERTER;
  EMPTY_BUFFER = bc.EMPTY_BUFFER;
  /* eslint-enable */
} else {
  BUFFER_CONVERTER = FALSE_CONVERTER;
}

/* eslint-disable */
let stream: any;
try {
  stream = require("stream");
} catch {}
/* eslint-enable */

export let READABLE_CONVERTER: Converter<Readable>;
export let EMPTY_READABLE: Readable;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (typeof stream?.Readable === "function") {
  /* eslint-disable */
  READABLE_CONVERTER = require("./ReadableConverter").READABLE_CONVERTER;
  EMPTY_READABLE = new stream.Readable({
    read() {
      this.push(EMPTY_BUFFER);
      this.push(null);
    },
  });
  /* eslint-enable */
} else {
  READABLE_CONVERTER = FALSE_CONVERTER;
}
