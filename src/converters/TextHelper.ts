import { hasBuffer } from ".";
import { Encoding } from "./Converter";

export interface TextHelper {
  toText(u8: Uint8Array, bufEnc: Encoding): Promise<string>;
  toUint8Array(text: string, bufEnc: Encoding): Promise<Uint8Array>;
}

export let TEXT_HELPER: TextHelper;
if (hasBuffer) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  TEXT_HELPER = require("./NodeEncoder");
} else {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  TEXT_HELPER = require("./DefaultEncoder");
}
