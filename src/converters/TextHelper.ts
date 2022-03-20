import { hasBuffer } from ".";
import { CharsetType } from "../def";

export interface TextHelper {
  bufferToText(buf: Uint8Array, bufCharset: CharsetType): Promise<string>;
  textToBuffer(text: string, bufCharset: CharsetType): Promise<Uint8Array>;
}

export let TEXT_HELPER: TextHelper;
if (hasBuffer) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  TEXT_HELPER = require("./NodeEncoder");
} else {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  TEXT_HELPER = require("./DefaultEncoder");
}
