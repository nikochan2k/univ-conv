import { hasBuffer } from ".";
import { Encoding } from "./Converter";

export interface Encoder {
  toText(buffer: Uint8Array, bufferEncoding: Encoding): Promise<string>;
  toUint8Array(text: string, bufferEncoding: Encoding): Promise<Uint8Array>;
}

export let ENCODER: Encoder;
if (hasBuffer) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ENCODER = require("./NodeEncoder");
} else {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ENCODER = require("./DefaultEncoder");
}
