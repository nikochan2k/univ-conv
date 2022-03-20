import { Encoding } from "./Converter";
import { TextHelper } from "./TextHelper";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let convert: any;
try {
  // eslint-disable-next-line
  convert = require("encoding-japanese").convert;
} catch {
  // Do nothing
}

class DefaultTextHelper implements TextHelper {
  toText(u8: Uint8Array, bufEnc: Encoding): Promise<string> {
    if (bufEnc === "utf8" || bufEnc === "utf-8") {
      return Promise.resolve(textDecoder.decode(u8));
    }
    if (convert) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Promise.resolve(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          convert(u8, {
            to: "UNICODE",
            from: bufEnc.toUpperCase(),
            type: "string",
          })
        );
      } catch {
        // Do nothing
      }
    }
    if (bufEnc === "utf16le") {
      return Promise.resolve(String.fromCharCode.apply(null, Array.from(u8)));
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufEnc);
  }

  toUint8Array(text: string, bufEnc: Encoding): Promise<Uint8Array> {
    if (bufEnc === "utf8" || bufEnc === "utf-8") {
      return Promise.resolve(textEncoder.encode(text));
    }
    if (convert) {
      try {
        // eslint-disable-next-line
        const ab: ArrayBuffer = convert(text, {
          to: bufEnc.toUpperCase(),
          from: "UNICODE",
          type: "arraybuffer",
        });
        return Promise.resolve(new Uint8Array(ab));
      } catch {
        // Do nothing
      }
    }
    if (bufEnc === "utf16le") {
      const buf = new ArrayBuffer(text.length * 2);
      const u16 = new Uint16Array(buf);
      for (let i = 0, strLen = text.length; i < strLen; i++) {
        u16[i] = text.charCodeAt(i);
      }
      return Promise.resolve(new Uint8Array(buf));
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufEnc);
  }
}

export const DEFAULT_TEXT_HELPER = new DefaultTextHelper();
