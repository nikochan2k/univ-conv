import { EMPTY_BUFFER, UINT8_ARRAY_CONVERTER } from ".";
import { ARRAY_BUFFER_CONVERTER } from "./ArrayBufferConverter";
import { AbstractConverter, ConvertOptions } from "./Converter";
import { TEXT_HELPER } from "./TextHelper";

class BufferConverter extends AbstractConverter<Buffer> {
  public typeEquals(input: unknown): input is Buffer {
    return (
      input instanceof Buffer || toString.call(input) === "[object Buffer]"
    );
  }

  protected async _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<Buffer | undefined> {
    if (this.typeEquals(input)) {
      return input;
    }

    if (!options.outputEncoding) options.outputEncoding = "utf8";

    if (typeof input === "string") {
      const inputEncoding = options.inputEncoding;
      if (inputEncoding === "base64") {
        return Buffer.from(input, "base64");
      } else if (inputEncoding === "binary") {
        return Buffer.from(input, "binary");
      } else if (inputEncoding === "hex") {
        return Buffer.from(input, "hex");
      }
    }
    if (UINT8_ARRAY_CONVERTER.typeEquals(input)) {
      return Buffer.from(input.buffer, input.byteOffset, input.byteLength);
    }

    const ab = await ARRAY_BUFFER_CONVERTER.convert(input, options);
    if (ab) {
      return Buffer.from(ab);
    }

    return undefined;
  }

  protected _isEmpty(input: Buffer): boolean {
    return 0 === input.byteLength;
  }

  protected _merge(chunks: Buffer[]): Promise<Buffer> {
    return Promise.resolve(Buffer.concat(chunks));
  }

  protected async _toArrayBuffer(
    input: Buffer,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    return UINT8_ARRAY_CONVERTER.toArrayBuffer(input, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toBase64(input: Buffer, _: ConvertOptions): Promise<string> {
    return Promise.resolve(input.toString("base64"));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toText(input: Buffer, options: ConvertOptions): Promise<string> {
    return TEXT_HELPER.bufferToText(input, options.inputEncoding, "utf16le");
  }

  protected _toUint8Array(input: Buffer): Promise<Uint8Array> {
    return Promise.resolve(input);
  }

  protected empty(): Buffer {
    return EMPTY_BUFFER;
  }
}

export const BUFFER_CONVERTER = new BufferConverter();
