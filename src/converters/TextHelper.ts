import { hasBuffer } from ".";
import { Encoding } from "./Converter";

export interface TextHelper {
  bufferToText(
    buf: Uint8Array,
    bufEnc: Encoding,
    textEnc: Encoding
  ): Promise<string>;
  textToBuffer(
    text: string,
    textEnc: Encoding,
    bufEnc: Encoding
  ): Promise<Uint8Array>;
}

export let TEXT_HELPER: TextHelper;
if (hasBuffer) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  TEXT_HELPER = require("./NodeEncoder");
} else {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  TEXT_HELPER = require("./DefaultEncoder");
}
