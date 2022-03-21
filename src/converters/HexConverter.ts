import {
  AbstractConverter,
  ConvertOptions,
  InputType,
  Options,
} from "./Converter";
import { TEXT_HELPER } from "./TextHelper";
import { UINT8_ARRAY_CONVERTER } from "./Uint8ArrayConverter";

const BYTE_TO_HEX: string[] = [];
for (let n = 0; n <= 0xff; ++n) {
  const hexOctet = n.toString(16).padStart(2, "0");
  BYTE_TO_HEX.push(hexOctet);
}

const HEX_STRINGS = "0123456789abcdef";
const MAP_HEX: { [key: string]: number } = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  a: 10,
  A: 10,
  b: 11,
  B: 11,
  c: 12,
  C: 12,
  d: 13,
  D: 13,
  e: 14,
  E: 14,
  f: 15,
  F: 15,
};

class HexConverter extends AbstractConverter<string> {
  public typeEquals(input: unknown): input is string {
    return typeof input === "string";
  }

  protected async _convert(
    input: InputType,
    options: ConvertOptions
  ): Promise<string | undefined> {
    if (typeof input === "string") {
      if (options.encoding === "hex") {
        return input;
      }
    }

    const u8 = await UINT8_ARRAY_CONVERTER.convert(input, options);
    if (u8) {
      return (
        Array.from(u8)
          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
          .map((b) => (HEX_STRINGS[b >> 4] as string) + HEX_STRINGS[b & 15])
          .join("")
      );
    }

    return undefined;
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async _merge(chunks: string[], _: Options): Promise<string> {
    return Promise.resolve(chunks.join(""));
  }

  protected async _toArrayBuffer(
    input: string,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this._toUint8Array(input, options);
    return UINT8_ARRAY_CONVERTER.toArrayBuffer(u8, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toBase64(input: string, _: ConvertOptions): Promise<string> {
    return Promise.resolve(input);
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return TEXT_HELPER.bufferToText(u8, options.inputCharset);
  }

  protected _toUint8Array(
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: ConvertOptions
  ): Promise<Uint8Array> {
    const bytes = new Uint8Array(Math.floor(input.length / 2));
    let i;
    for (i = 0; i < bytes.length; i++) {
      const ai = input[i * 2] as string;
      const a = MAP_HEX[ai];
      const bi = input[i * 2 + 1] as string;
      const b = MAP_HEX[bi];
      if (a === undefined || b === undefined) {
        break;
      }
      bytes[i] = (a << 4) | b;
    }
    return Promise.resolve(i === bytes.length ? bytes : bytes.slice(0, i));
  }

  protected empty(): string {
    return "";
  }
}

export const HEX_CONVERTER = new HexConverter();
