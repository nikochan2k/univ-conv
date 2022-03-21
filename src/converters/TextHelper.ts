import { CharsetType, hasBuffer } from "./Converter";

export interface TextHelper {
  bufferToText(buf: Uint8Array, bufCharset: CharsetType): Promise<string>;
  textToBuffer(text: string, bufCharset: CharsetType): Promise<Uint8Array>;
}

export let TEXT_HELPER: TextHelper;
/* eslint-disable */
if (hasBuffer) {
  TEXT_HELPER = require("./NodeTextHelper").NODE_TEXT_HELPER;
} else {
  TEXT_HELPER = require("./DefaultTextHelper").DEFAULT_TEXT_HELPER;
}
