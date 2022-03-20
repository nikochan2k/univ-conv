import { BUFFER_CONVERTER } from ".";
import { Encoding } from "./Converter";
import { TextHelper } from "./TextHelper";

const ENCODINGS = [
  "ascii",
  "utf8",
  "utf-8",
  "utf16le",
  "ucs2",
  "ucs-2",
  "base64",
  "base64url",
  "latin1",
  "binary",
  "hex",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let convert: any;
try {
  // eslint-disable-next-line
  convert = require("encoding-japanese").convert;
} catch {
  // Do nothing
}

class NodeTextHelper implements TextHelper {
  async bufferToText(u8: Uint8Array, bufEnc: BufferEncoding): Promise<string> {
    let buf: Buffer;
    if (BUFFER_CONVERTER.typeEquals(u8)) {
      buf = u8;
    } else {
      buf = await BUFFER_CONVERTER.convert(u8);
    }
    if (ENCODINGS.indexOf(bufEnc)) {
      return buf.toString(bufEnc);
    }
    if (convert) {
      try {
        // eslint-disable-next-line
        return convert(u8, {
          to: "UNICODE",
          from: bufEnc,
          type: "string",
        });
      } catch {
        // Do nothing
      }
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufEnc);
  }

  textToBuffer(text: string, bufEnc: Encoding): Promise<Uint8Array> {
    if (ENCODINGS.indexOf(bufEnc)) {
      return Promise.resolve(Buffer.from(text, bufEnc as BufferEncoding));
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

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufEnc);
  }
}

export const NODE_TEXT_HELPER = new NodeTextHelper();
