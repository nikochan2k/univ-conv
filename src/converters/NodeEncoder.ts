import { BUFFER_CONVERTER } from ".";
import { Encoding } from "./Converter";
import { Encoder } from "./Encoder";

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

class NodeEncoder implements Encoder {
  async toText(
    buffer: Uint8Array,
    bufferEncoding: BufferEncoding
  ): Promise<string> {
    let buf: Buffer;
    if (BUFFER_CONVERTER.is(buffer)) {
      buf = buffer;
    } else {
      buf = await BUFFER_CONVERTER.convert(buffer);
    }
    if (ENCODINGS.indexOf(bufferEncoding)) {
      return buf.toString(bufferEncoding);
    }
    if (convert) {
      try {
        // eslint-disable-next-line
        return convert(buffer, {
          to: "UNICODE",
          from: bufferEncoding,
          type: "string",
        });
      } catch {
        // Do nothing
      }
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufferEncoding);
  }

  toUint8Array(text: string, bufferEncoding: Encoding): Promise<Uint8Array> {
    if (ENCODINGS.indexOf(bufferEncoding)) {
      return Promise.resolve(
        Buffer.from(text, bufferEncoding as BufferEncoding)
      );
    }
    if (convert) {
      try {
        // eslint-disable-next-line
        const ab: ArrayBuffer = convert(text, {
          to: bufferEncoding.toUpperCase(),
          from: "UNICODE",
          type: "arraybuffer",
        });
        return Promise.resolve(new Uint8Array(ab));
      } catch {
        // Do nothing
      }
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufferEncoding);
  }
}

export const NODE_ENCODER = new NodeEncoder();
