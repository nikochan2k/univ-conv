import type { Readable } from "stream";
import {
  arrayBufferConverter,
  base64Converter,
  blobConverter,
  readableConverter,
  readableStreamConverter,
  textConverter,
  uint8ArrayConverter,
} from "./converters";
import { AbstractConverter, ConvertOptions, Data, Options } from "./core";
import {
  dataUrlToBase64,
  fileToBuffer,
  getFileSize,
  isBrowser,
  isNode,
  toFileURL,
} from "./util";

if (typeof fetch !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  globalThis.fetch = require("node-fetch");
}

class URLConverter extends AbstractConverter<string> {
  public typeEquals(input: unknown): input is string {
    return typeof input === "string";
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<string | undefined> {
    let url: string;
    const type = options.dstURLType;
    if (type === "file" && toFileURL) {
      const readable = await readableConverter().convert(input, options);
      url = await toFileURL(readable);
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
    } else if (input.startsWith("blob:") && isBrowser) {
      const res = await fetch(input);
      const blob = await res.blob();
      return blob.size;
    } else if (input.startsWith("data:")) {
      const base64 = dataUrlToBase64(input);
      return base64Converter().getSize(base64);
    } else {
      const resp = await fetch(input, { method: "HEAD" });
      const str = resp.headers.get("Content-Length");
      const length = Math.trunc(str as any); // eslint-disable-line
      if (!isNaN(length)) {
        return length;
      }
    }
    throw new Error(`Cannot get size of ${input}`);
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async _merge(urls: string[], options: Options): Promise<string> {
    if (isNode) {
      const converter = readableConverter();
      const readables: Readable[] = [];
      for (const url of urls) {
        const readable = await converter.convert(url);
        readables.push(readable);
      }
      const merged = await converter.merge(readables);
      return (await this._convert(merged, {
        ...options,
        dstURLType: "file",
      })) as string;
    } else if (isBrowser) {
      const converter = readableStreamConverter();
      const readables: ReadableStream<unknown>[] = [];
      for (const url of urls) {
        const readable = await converter.convert(url);
        readables.push(readable);
      }
      const merged = await converter.merge(readables);
      return (await this._convert(merged, {
        ...options,
        dstURLType: "blob",
      })) as string;
    } else {
      const buffers: ArrayBuffer[] = [];
      for (const url of urls) {
        const buffer = await this._toArrayBuffer(url, options);
        buffers.push(buffer);
      }
      const merged = await arrayBufferConverter().merge(buffers, options);
      return (await this._convert(merged, {
        ...options,
        dstURLType: "data",
      })) as string;
    }
  }

  protected async _toArrayBuffer(
    input: string,
    _options: ConvertOptions // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<ArrayBuffer> {
    if (input.startsWith("file:") && fileToBuffer) {
      const buffer = fileToBuffer(input);
      return buffer.buffer;
    } else {
      const body = await fetch(input);
      return body.arrayBuffer();
    }
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
    return uint8ArrayConverter().toBase64(u8, options);
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const ab = await this._toArrayBuffer(input, options);
    return textConverter().convert(ab, options);
  }

  protected async _toUint8Array(
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const ab = await this.toArrayBuffer(input, options);
    return new Uint8Array(ab);
  }

  protected empty(): string {
    return "";
  }
}

export const INSTANCE = new URLConverter();
