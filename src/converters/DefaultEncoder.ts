import { Encoding } from "./Converter";
import { Encoder } from "./Encoder";

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

class DefaultEncoder implements Encoder {
  toText(buffer: Uint8Array, bufferEncoding: Encoding): Promise<string> {
    if (bufferEncoding === "utf8" || bufferEncoding === "utf-8") {
      return Promise.resolve(textDecoder.decode(buffer));
    }
    if (convert) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Promise.resolve(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          convert(buffer, {
            to: "UNICODE",
            from: bufferEncoding.toUpperCase(),
            type: "string",
          })
        );
      } catch {
        // Do nothing
      }
    }
    if (bufferEncoding === "utf16le") {
      return Promise.resolve(
        String.fromCharCode.apply(null, Array.from(buffer))
      );
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufferEncoding);
  }

  toUint8Array(text: string, bufferEncoding: Encoding): Promise<Uint8Array> {
    if (bufferEncoding === "utf8" || bufferEncoding === "utf-8") {
      return Promise.resolve(textEncoder.encode(text));
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
    if (bufferEncoding === "utf16le") {
      const buf = new ArrayBuffer(text.length * 2);
      const u16 = new Uint16Array(buf);
      for (let i = 0, strLen = text.length; i < strLen; i++) {
        u16[i] = text.charCodeAt(i);
      }
      return Promise.resolve(new Uint8Array(buf));
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufferEncoding);
  }
}

export const DEFAULT_ENCODER = new DefaultEncoder();
