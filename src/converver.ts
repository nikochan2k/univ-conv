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
  isWritable,
  isWritableStream,
  Options,
  readableConverter,
  readableStreamConverter,
  textConverter,
  typeOf,
  uint8ArrayConverter,
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
  : T extends "readblestream"
  ? ReadableStream<unknown>
  : string;

export class DefaultConverter {
  public convert<T extends DataType>(
    input: Data,
    to: T,
    options?: Partial<ConvertOptions>
  ): Promise<ReturnData<T>> {
    return this._convert(input, to, options) as Promise<ReturnData<T>>;
  }

  public getSize<T extends DataType>(
    input: Data,
    to: T,
    options?: Partial<Options>
  ) {
    switch (to) {
      case "arraybuffer":
        return arrayBufferConverter().getSize(input as ArrayBuffer, options);
      case "uint8array":
        return uint8ArrayConverter().getSize(input as Uint8Array, options);
      case "buffer":
        return bufferConverter().getSize(input as Buffer, options);
      case "blob":
        return blobConverter().getSize(input as Blob, options);
      case "readable":
        return readableConverter().getSize(input as Readable, options);
      case "readablestream":
        return readableStreamConverter().getSize(
          input as ReadableStream<unknown>,
          options
        );
      case "text":
        return textConverter().getSize(input as string, options);
      case "base64":
        return base64Converter().getSize(input as string, options);
      case "binary":
        return binaryConverter().getSize(input as string, options);
      case "hex":
        return hexConverter().getSize(input as string, options);
    }

    throw new Error("Illegal output type: " + to);
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
    output: Writable | WritableStream<unknown>,
    options?: Partial<ConvertOptions>
  ) {
    if (isWritable(output)) {
      const readable = await readableConverter().convert(input, options);
      await new Promise<void>((resolve, reject) => {
        const onError = (err: Error) => {
          reject(err);
          readable.destroy();
          output.destroy();
          readable.removeAllListeners();
          output.removeAllListeners();
        };
        readable.once("error", onError);
        output.once("error", onError);
        output.once("finish", () => {
          resolve();
        });
        readable.pipe(output);
      });
    } else if (isWritableStream(output)) {
      let stream: ReadableStream<unknown> | undefined;
      try {
        stream = await readableStreamConverter().convert(input);
        if (typeof stream.pipeTo === "function") {
          await stream.pipeTo(output);
        } else {
          const writer = output.getWriter();
          await handleReadableStream(stream, (chunk) => writer.write(chunk));
        }
      } finally {
        closeStream(output);
        closeStream(stream);
      }
    }

    throw new Error("Illegal output type: " + typeOf(output));
  }

  public toArrayBuffer(input: Data, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "arraybuffer", options);
    } else {
      return this.convert(input, "arraybuffer", options);
    }
  }

  public toBase64(input: Data, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "base64", options);
    } else {
      return this.convert(input, "base64", options);
    }
  }

  public toBinary(input: Data, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "binary", options);
    } else {
      return this.convert(input, "binary", options);
    }
  }

  public toBlob(input: Data, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "blob", options);
    } else {
      return this.convert(input, "blob", options);
    }
  }

  public toBuffer(input: Data, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "buffer", options);
    } else {
      return this.convert(input, "buffer", options);
    }
  }

  public toHex(input: Data, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "hex", options);
    } else {
      return this.convert(input, "hex", options);
    }
  }

  public toReadable(input: Data, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "readable", options);
    } else {
      return this.convert(input, "readable", options);
    }
  }

  public toReadableStream(input: Data, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "readablestream", options);
    } else {
      return this.convert(input, "readablestream", options);
    }
  }

  public toText(input: Data, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "text", options);
    } else {
      return this.convert(input, "text", options);
    }
  }

  public toUint8Array(input: Data, options?: Partial<ConvertOptions>) {
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
      case "uint8array":
        return uint8ArrayConverter().convert(input, options);
      case "buffer":
        return bufferConverter().convert(input, options);
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
      case "uint8array":
        return uint8ArrayConverter().merge(results as Uint8Array[], options);
      case "buffer":
        return bufferConverter().merge(results as Buffer[], options);
      case "blob":
        return blobConverter().merge(results as Blob[], options);
      case "readable":
        return readableConverter().merge(results as Readable[], options);
      case "readablestream":
        return readableStreamConverter().merge(
          results as ReadableStream<unknown>[],
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
    }

    throw new Error("Illegal output type: " + to);
  }
}

export const DEFAULT_CONVERTER = new DefaultConverter();
