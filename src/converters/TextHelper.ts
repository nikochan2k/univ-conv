import { CharsetType, hasBuffer } from "./core";

export interface TextHelper {
  bufferToText(buf: Uint8Array, bufCharset: CharsetType): Promise<string>;
  textToBuffer(text: string, bufCharset: CharsetType): Promise<Uint8Array>;
}

let TEXT_HELPER: TextHelper;
/* eslint-disable */
export function textHelper() {
  if (!TEXT_HELPER) {
    if (hasBuffer) {
      TEXT_HELPER = require("./NodeTextHelper").NODE_TEXT_HELPER;
    } else {
      TEXT_HELPER = require("./DefaultTextHelper").DEFAULT_TEXT_HELPER;
    }
  }
  return TEXT_HELPER;
}
