import {
  base64Converter,
  blobConverter,
  readableConverter,
  uint8ArrayConverter,
} from "./converters";
import { AbstractConverter, ConvertOptions, Data, Options } from "./core";
import { dataUrlToBase64, getFileSize, hasBlob, toFileURL } from "./util";

class TextConverter extends AbstractConverter<string> {
  public typeEquals(input: unknown): input is string {
    return typeof input === "string";
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<string | undefined> {
    let url: string;
    const type = options.dstURLType;
    if (type === "file") {
      const readable = await readableConverter().convert(input, options);
      url = await toFileURL!(readable); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    } else if (type === "blob") {
      const blob = await blobConverter().convert(input, options);
      url = URL.createObjectURL(blob);
    } else {
      const base64 = await base64Converter().convert(input, options);
      url = "data:application/octet-stream;base64," + base64;
    }
    return url;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async _getSize(input: string, _options: Options): Promise<number> {
    if (input.startsWith("file:") && getFileSize) {
      return getFileSize(input);
    } else if (input.startsWith("blob:") && hasBlob) {
      const res = await fetch(input);
      const blob = await res.blob();
      return blob.size;
    } else if (input.startsWith("data:")) {
      const base64 = dataUrlToBase64(input);
      return base64Converter().getSize(base64);
    }
    throw new Error(`Cannot get size of ${input}`);
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _merge(chunks: string[], _: Options): Promise<string> {
    return Promise.resolve(chunks.join(""));
  }

  protected async _toArrayBuffer(
    input: string,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this._toUint8Array(input, options);
    return uint8ArrayConverter().toArrayBuffer(u8, options);
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
    return uint8ArrayConverter().toBase64(u8, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toText(input: string, _: ConvertOptions): Promise<string> {
    return Promise.resolve(input);
  }

  protected _toUint8Array(
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: ConvertOptions
  ): Promise<Uint8Array> {
    const u8 = new Uint8Array(input.length * 2);
    for (let i = 0; i < u8.length; i += 2) {
      let x = input.charCodeAt(i / 2);
      const a = x % 256;
      x -= a;
      x /= 256;
      u8[i] = x;
      u8[i + 1] = a;
    }
    return Promise.resolve(u8);
  }

  protected empty(): string {
    return "";
  }
}

export const INSTANCE = new TextConverter();
