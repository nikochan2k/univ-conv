import { bufferConverter } from "./converters";
import { CharsetType } from "./core";
import { TextHelper } from "./TextHelper";

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
    bufCharset: CharsetType
  ): Promise<string> {
    let buffer: Buffer;
    if (bufferConverter().typeEquals(buf)) {
      buffer = buf;
    } else {
      buffer = await bufferConverter().convert(buf);
    }
    if (bufCharset === "utf8" || bufCharset === "utf16le") {
      return buffer.toString(bufCharset as BufferEncoding);
    }
    if (convert) {
      try {
        // eslint-disable-next-line
        return convert(buf, {
          to: "UNICODE",
          from: bufCharset.toUpperCase(),
          type: "string",
        });
      } catch {
        // Do nothing
      }
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufCharset);
  }

  async textToBuffer(
    text: string,
    bufCharset: CharsetType
  ): Promise<Uint8Array> {
    if (bufCharset === "utf8" || bufCharset === "utf16le") {
      return Buffer.from(text, bufCharset as BufferEncoding);
    }
    if (convert) {
      try {
        // eslint-disable-next-line
        const ab: ArrayBuffer = convert(text, {
          to: bufCharset.toUpperCase(),
          from: "UNICODE",
          type: "arraybuffer",
        });
        return Promise.resolve(new Uint8Array(ab));
      } catch {
        // Do nothing
      }
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufCharset);
  }
}

export const NODE_TEXT_HELPER = new NodeTextHelper();
