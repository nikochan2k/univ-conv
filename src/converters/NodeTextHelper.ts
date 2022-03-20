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
  async bufferToText(
    buf: Uint8Array,
    bufEnc: Encoding,
    textEnc: Encoding
  ): Promise<string> {
    let buffer: Buffer;
    if (BUFFER_CONVERTER.typeEquals(buf)) {
      buffer = buf;
    } else {
      buffer = await BUFFER_CONVERTER.convert(buf);
    }
    if (ENCODINGS.indexOf(textEnc)) {
      if (bufEnc === textEnc) {
        return buffer.toString(textEnc as BufferEncoding);
      }
      const text = buffer.toString(bufEnc as BufferEncoding);
      buffer = Buffer.from(text);
      return buffer.toString(textEnc as BufferEncoding);
    }
    if (convert) {
      try {
        // eslint-disable-next-line
        return convert(buf, {
          to: textEnc.toUpperCase(),
          from: bufEnc.toUpperCase(),
          type: "string",
        });
      } catch {
        // Do nothing
      }
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufEnc);
  }

  async textToBuffer(
    text: string,
    textEnc: Encoding,
    bufEnc: Encoding
  ): Promise<Uint8Array> {
    if (ENCODINGS.indexOf(bufEnc)) {
      if (textEnc !== "utf16le") {
        const buffer = Buffer.from(text, textEnc as BufferEncoding);
        text = buffer.toString("utf16le");
      }
      return Buffer.from(text, bufEnc as BufferEncoding);
    }
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

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufEnc);
  }
}

export const NODE_TEXT_HELPER = new NodeTextHelper();
