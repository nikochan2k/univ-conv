import type { Readable, Writable } from "stream";
import {
  arrayBufferConverter,
  base64Converter,
  binaryConverter,
  blobConverter,
  bufferConverter,
  closeStream,
  ConvertOptions,
  Data,
  DataType,
  handleReadableStream,
  hexConverter,
  isBrowser,
  isNode,
  isWritable,
  isWritableStream,
  Options,
  pipe,
  readableConverter,
  readableStreamConverter,
  textConverter,
  typeOf,
  uint8ArrayConverter,
  urlConverter,
} from "./converters";

export type ReturnData<T extends DataType> = T extends "arraybuffer"
  ? ArrayBuffer
  : T extends "uint8array"
  ? Uint8Array
  : T extends "buffer"
  ? Buffer
  : T extends "blob"
  ? Blob
  : T extends "readable"
  ? Readable
  : T extends "readablestream"
  ? ReadableStream<Uint8Array>
  : string;

export class DefaultConverter {
  public convert<T extends DataType>(
    input: Data,
    to: T,
    options?: Partial<ConvertOptions>
  ): Promise<ReturnData<T>> {
    return this._convert(input, to, options) as Promise<ReturnData<T>>;
  }

  public empty<T extends DataType>(type?: T) {
    switch (type) {
      case "arraybuffer":
        return arrayBufferConverter().empty();
      case "buffer":
        return bufferConverter().empty();
      case "uint8array":
        return uint8ArrayConverter().empty();
      case "blob":
        return blobConverter().empty();
      case "readable":
        return readableConverter().empty();
      case "readablestream":
        return readableStreamConverter().empty();
      case "text":
        return textConverter().empty();
      case "base64":
        return base64Converter().empty();
      case "binary":
        return binaryConverter().empty();
      case "hex":
        return hexConverter().empty();
      case "url":
        return urlConverter().empty();
    }

    if (isBrowser) {
      return blobConverter().empty();
    } else if (isNode) {
      return bufferConverter().empty();
    } else {
      return uint8ArrayConverter().empty();
    }
  }

  public getSize(input: Data, options?: Partial<Options>) {
    if (arrayBufferConverter().typeEquals(input)) {
      return arrayBufferConverter().getSize(input as ArrayBuffer, options);
    } else if (bufferConverter().typeEquals(input)) {
      return bufferConverter().getSize(input as Buffer, options);
    } else if (uint8ArrayConverter().typeEquals(input)) {
      return uint8ArrayConverter().getSize(input as Uint8Array, options);
    } else if (blobConverter().typeEquals(input)) {
      return blobConverter().getSize(input, options);
    } else if (readableConverter().typeEquals(input)) {
      return readableConverter().getSize(input, options);
    } else if (readableStreamConverter().typeEquals(input)) {
      return readableStreamConverter().getSize(input, options);
    } else if (typeof input === "string") {
      const type = options?.srcStringType;
      if (type == null || type === "text") {
        return textConverter().getSize(input, options);
      } else if (type === "base64") {
        return base64Converter().getSize(input, options);
      } else if (type === "binary") {
        return binaryConverter().getSize(input, options);
      } else if (type === "hex") {
        return hexConverter().getSize(input, options);
      } else if (type === "url") {
        return urlConverter().getSize(input, options);
      }
    }

    throw new Error("Illegal output type: " + typeOf(input));
  }

  public async merge<T extends DataType>(
    chunks: Data[],
    to: T,
    options?: Partial<Options>
  ): Promise<ReturnData<T>> {
    return this._merge(chunks, to, options) as Promise<ReturnData<T>>;
  }

  public async pipe(
    input: Data,
    output: Writable | WritableStream<Uint8Array>,
    options?: Partial<ConvertOptions>
  ) {
    if (isWritable(output)) {
      const readable = await readableConverter().convert(input, options);
      try {
        await pipe(readable, output);
      } catch (e) {
        closeStream(output, e);
      }
    } else if (isWritableStream(output)) {
      let stream: ReadableStream<Uint8Array>;
      try {
        stream = await readableStreamConverter().convert(input, options);
        if (typeof stream.pipeTo === "function") {
          await stream.pipeTo(output);
        } else {
          const writer = output.getWriter();
          await handleReadableStream(stream, async (chunk) => {
            await writer.write(chunk);
            return true;
          });
        }
        closeStream(output);
      } catch (e) {
        closeStream(output, e);
      }
    } else {
      throw new Error("Illegal output type: " + typeOf(output));
    }
  }

  public slice(input: Data, options: Partial<ConvertOptions>) {
    if (
      typeof options.start !== "number" &&
      typeof options.length === "number"
    ) {
      throw new Error(
        "Illegal argument: options.start and options.length are undefined."
      );
    }

    let to: DataType | undefined;
    if (arrayBufferConverter().typeEquals(input)) {
      to = "arraybuffer";
    } else if (bufferConverter().typeEquals(input)) {
      to = "buffer";
    } else if (uint8ArrayConverter().typeEquals(input)) {
      to = "uint8array";
    } else if (blobConverter().typeEquals(input)) {
      to = "blob";
    } else if (readableConverter().typeEquals(input)) {
      to = "readable";
    } else if (readableStreamConverter().typeEquals(input)) {
      to = "readablestream";
    } else if (typeof input === "string") {
      const type = options?.srcStringType;
      if (type == null || type === "text") {
        to = "text";
      } else if (type === "base64") {
        to = "base64";
      } else if (type === "binary") {
        to = "binary";
      } else if (type === "hex") {
        to = "hex";
      } else if (type === "url") {
        to = "url";
      }
    }
    if (to) {
      return this._convert(input, to, options);
    }

    throw new Error("Illegal output type: " + typeOf(input));
  }

  public toArrayBuffer(
    input: Data | Data[],
    options?: Partial<ConvertOptions>
  ) {
    if (Array.isArray(input)) {
      return this.merge(input, "arraybuffer", options);
    } else {
      return this.convert(input, "arraybuffer", options);
    }
  }

  public toBase64(input: Data | Data[], options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "base64", options);
    } else {
      return this.convert(input, "base64", options);
    }
  }

  public toBinary(input: Data | Data[], options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "binary", options);
    } else {
      return this.convert(input, "binary", options);
    }
  }

  public toBlob(input: Data | Data[], options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "blob", options);
    } else {
      return this.convert(input, "blob", options);
    }
  }

  public toBuffer(input: Data | Data[], options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "buffer", options);
    } else {
      return this.convert(input, "buffer", options);
    }
  }

  public toHex(input: Data | Data[], options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "hex", options);
    } else {
      return this.convert(input, "hex", options);
    }
  }

  public toReadable(input: Data | Data[], options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "readable", options);
    } else {
      return this.convert(input, "readable", options);
    }
  }

  public toReadableStream(
    input: Data | Data[],
    options?: Partial<ConvertOptions>
  ) {
    if (Array.isArray(input)) {
      return this.merge(input, "readablestream", options);
    } else {
      return this.convert(input, "readablestream", options);
    }
  }

  public toText(input: Data | Data[], options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "text", options);
    } else {
      return this.convert(input, "text", options);
    }
  }

  public toURL(input: Data | Data[], options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "url", options);
    } else {
      return this.convert(input, "url", options);
    }
  }

  public toUint8Array(input: Data | Data[], options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "uint8array", options);
    } else {
      return this.convert(input, "uint8array", options);
    }
  }

  protected _convert<T extends DataType>(
    input: Data,
    to: T,
    options?: Partial<ConvertOptions>
  ) {
    switch (to) {
      case "arraybuffer":
        return arrayBufferConverter().convert(input, options);
      case "buffer":
        return bufferConverter().convert(input, options);
      case "uint8array":
        return uint8ArrayConverter().convert(input, options);
      case "blob":
        return blobConverter().convert(input, options);
      case "readable":
        return readableConverter().convert(input, options);
      case "readablestream":
        return readableStreamConverter().convert(input, options);
      case "text":
        return textConverter().convert(input, options);
      case "base64":
        return base64Converter().convert(input, options);
      case "binary":
        return binaryConverter().convert(input, options);
      case "hex":
        return hexConverter().convert(input, options);
      case "url":
        return urlConverter().convert(input, options);
    }

    throw new Error("Illegal output type: " + to);
  }

  protected async _convertAll<T extends DataType>(
    chunks: Data[],
    to: T,
    options?: Partial<ConvertOptions>
  ): Promise<ReturnData<T>[]> {
    const results: ReturnData<T>[] = [];
    for (const chunk of chunks) {
      const converted = await this.convert(chunk, to, options);
      results.push(converted);
    }
    return results;
  }

  protected async _merge<T extends DataType>(
    chunks: Data[],
    to: T,
    options?: Partial<Options>
  ) {
    const results = await this._convertAll(chunks, to, options);

    switch (to) {
      case "arraybuffer":
        return arrayBufferConverter().merge(results as ArrayBuffer[], options);
      case "buffer":
        return bufferConverter().merge(results as Buffer[], options);
      case "uint8array":
        return uint8ArrayConverter().merge(results as Uint8Array[], options);
      case "blob":
        return blobConverter().merge(results as Blob[], options);
      case "readable":
        return readableConverter().merge(results as Readable[], options);
      case "readablestream":
        return readableStreamConverter().merge(
          results as ReadableStream<Uint8Array>[],
          options
        );
      case "text":
        return textConverter().merge(results as string[], options);
      case "base64":
        return base64Converter().merge(results as string[], options);
      case "binary":
        return binaryConverter().merge(results as string[], options);
      case "hex":
        return hexConverter().merge(results as string[], options);
      case "url":
        return urlConverter().merge(results as string[], options);
    }

    throw new Error("Illegal output type: " + to);
  }
}

export const DEFAULT_CONVERTER = new DefaultConverter();
