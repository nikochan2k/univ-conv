import { CharsetType } from "../def";
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

function textToUtf16leBuffer(text: string) {
  const ab = new ArrayBuffer(text.length * 2);
  const u16 = new Uint16Array(ab);
  for (let i = 0, strLen = text.length; i < strLen; i++) {
    u16[i] = text.charCodeAt(i);
  }
  return ab;
}

class DefaultTextHelper implements TextHelper {
  bufferToText(u8: Uint8Array, bufCharset: CharsetType): Promise<string> {
    if (convert) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Promise.resolve(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          convert(u8, {
            to: "UTF16LE",
            from: bufCharset.toUpperCase(),
            type: "string",
          })
        );
      } catch {
        // Do nothing
      }
    }
    if (bufCharset === "utf8") {
      return Promise.resolve(textDecoder.decode(u8));
    }
    if (bufCharset === "utf16le") {
      return Promise.resolve(String.fromCharCode.apply(null, Array.from(u8)));
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufCharset);
  }

  textToBuffer(text: string, bufCharset: CharsetType): Promise<Uint8Array> {
    if (convert) {
      try {
        // eslint-disable-next-line
        const ab: ArrayBuffer = convert(text, {
          to: bufCharset.toUpperCase(),
          from: "UTF16LE",
          type: "arraybuffer",
        });
        return Promise.resolve(new Uint8Array(ab));
      } catch {
        // Do nothing
      }
    }
    if (bufCharset === "utf8") {
      return Promise.resolve(textEncoder.encode(text));
    }
    if (bufCharset === "utf16le") {
      const ab = textToUtf16leBuffer(text);
      return Promise.resolve(new Uint8Array(ab));
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufCharset);
  }
}

export const DEFAULT_TEXT_HELPER = new DefaultTextHelper();
