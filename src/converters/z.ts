import type { Readable } from "stream";
import {
  EMPTY_BLOB,
  EMPTY_BUFFER,
  EMPTY_READABLE,
  EMPTY_READABLE_STREAM,
} from "./Converter";
import { FalseConverter } from "./FalseConverter";
import { Converter } from "./types";

/* eslint-disable */
export let BLOB_CONVERTER: Converter<Blob>;
if (EMPTY_BLOB) {
  BLOB_CONVERTER = require("./BlobConverter").BLOB_CONVERTER;
} else {
  BLOB_CONVERTER = new FalseConverter("Blob");
}
export let READABLE_STREAM_CONVERTER: Converter<ReadableStream<unknown>>;
if (EMPTY_READABLE_STREAM) {
  READABLE_STREAM_CONVERTER =
    require("./ReadableStreamConverter").READABLE_STREAM_CONVERTER;
} else {
  READABLE_STREAM_CONVERTER = new FalseConverter("ReadableStream");
}
export let BUFFER_CONVERTER: Converter<Buffer>;
if (EMPTY_BUFFER) {
  BUFFER_CONVERTER = require("./BufferConverter").BUFFER_CONVERTER;
} else {
  BUFFER_CONVERTER = new FalseConverter("Buffer");
}
export let READABLE_CONVERTER: Converter<Readable>;
if (EMPTY_READABLE) {
  READABLE_CONVERTER = require("./ReadableConverter").READABLE_CONVERTER;
} else {
  READABLE_CONVERTER = new FalseConverter("Readable");
}
