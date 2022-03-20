import type { Readable } from "stream";
import {
  Converter,
  EMPTY_BLOB,
  EMPTY_BUFFER,
  EMPTY_READABLE_STREAM,
} from "./Converter";
import { FALSE_CONVERTER } from "./FalseConverter";

/* eslint-disable */
export let BLOB_CONVERTER: Converter<Blob>;
if (EMPTY_BLOB) {
  BLOB_CONVERTER = require("./BlobConverter").BLOB_CONVERTER;
} else {
  BLOB_CONVERTER = FALSE_CONVERTER;
}
export let READABLE_STREAM_CONVERTER: Converter<ReadableStream<unknown>>;
if (EMPTY_READABLE_STREAM) {
  READABLE_STREAM_CONVERTER =
    require("./ReadableStreamConverter").READABLE_STREAM_CONVERTER;
} else {
  READABLE_STREAM_CONVERTER = FALSE_CONVERTER;
}
export let BUFFER_CONVERTER: Converter<Buffer>;
if (EMPTY_BUFFER) {
  BUFFER_CONVERTER = require("./BufferConverter").BUFFER_CONVERTER;
} else {
  BUFFER_CONVERTER = FALSE_CONVERTER;
}
export let READABLE_CONVERTER: Converter<Readable>;
if (EMPTY_READABLE_STREAM) {
  READABLE_CONVERTER =
    require("./ReadableStreamConverter").READABLE_STREAM_CONVERTER;
} else {
  READABLE_CONVERTER = FALSE_CONVERTER;
}
