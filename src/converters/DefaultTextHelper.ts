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

function textToUtf16leBuffer(text: string) {
  const ab = new ArrayBuffer(text.length * 2);
  const u16 = new Uint16Array(ab);
  for (let i = 0, strLen = text.length; i < strLen; i++) {
    u16[i] = text.charCodeAt(i);
  }
  return ab;
}

class DefaultTextHelper implements TextHelper {
  bufferToText(
    u8: Uint8Array,
    bufEnc: Encoding,
    textEnc: Encoding
  ): Promise<string> {
    if (convert) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Promise.resolve(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          convert(u8, {
            to: textEnc.toUpperCase(),
            from: bufEnc.toUpperCase(),
            type: "string",
          })
        );
      } catch {
        // Do nothing
      }
    }
    if (bufEnc === "utf8" || bufEnc === "utf-8") {
      if (textEnc === "utf16le") {
        return Promise.resolve(textDecoder.decode(u8));
      }
      if (textEnc === "utf8" || textEnc === "utf-8") {
        return Promise.resolve(String.fromCharCode.apply(null, Array.from(u8)));
      }
    }
    if (bufEnc === "utf16le") {
      if (textEnc === "utf16le") {
        return Promise.resolve(String.fromCharCode.apply(null, Array.from(u8)));
      }
      if (textEnc === "utf8" || textEnc === "utf-8") {
        return Promise.resolve(textDecoder.decode(u8));
      }
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufEnc);
  }

  textToBuffer(
    text: string,
    textEnc: Encoding,
    bufEnc: Encoding
  ): Promise<Uint8Array> {
    if (convert) {
      try {
        // eslint-disable-next-line
        const ab: ArrayBuffer = convert(text, {
          to: bufEnc.toUpperCase(),
          from: textEnc.toUpperCase(),
          type: "arraybuffer",
        });
        return Promise.resolve(new Uint8Array(ab));
      } catch {
        // Do nothing
      }
    }
    if (textEnc === "utf16le") {
      if (bufEnc === "utf8" || bufEnc === "utf-8") {
        return Promise.resolve(textEncoder.encode(text));
      }
      if (bufEnc === "utf16le") {
        const ab = textToUtf16leBuffer(text);
        return Promise.resolve(new Uint8Array(ab));
      }
    }
    if (textEnc === "utf8" || textEnc === "utf-8") {
      let ab = textToUtf16leBuffer(text);
      const u8 = new Uint8Array(ab);
      if (bufEnc === "utf8" || bufEnc === "utf-8") {
        return Promise.resolve(u8);
      }
      if (bufEnc === "utf16le") {
        text = textDecoder.decode(u8);
        ab = textToUtf16leBuffer(text);
        return Promise.resolve(new Uint8Array(ab));
      }
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufEnc);
  }
}

export const DEFAULT_TEXT_HELPER = new DefaultTextHelper();
