import type { Readable, Writable } from "stream";
import {
  ARRAY_BUFFER_CONVERTER,
  BASE64_CONVERTER,
  BINARY_CONVERTER,
  BLOB_CONVERTER,
  BUFFER_CONVERTER,
  closeStream,
  ConvertOptions,
  handleReadableStream,
  HEX_CONVERTER,
  isWritable,
  isWritableStream,
  Options,
  READABLE_CONVERTER,
  READABLE_STREAM_CONVERTER,
  ReturnType,
  TEXT_CONVERTER,
  Type,
  typeOf,
  UINT8_ARRAY_CONVERTER,
} from "./converters";

export class Conv {
  public convert<T extends Type>(
    input: unknown,
    to: T,
    options?: Partial<ConvertOptions>
  ): Promise<ReturnType<T>> {
    return this._convert(input, to, options) as Promise<ReturnType<T>>;
  }

  public async merge<T extends Type>(
    chunks: unknown[],
    to: T,
    options?: Partial<Options>
  ): Promise<ReturnType<T>> {
    return this._merge(chunks, to, options) as Promise<ReturnType<T>>;
  }

  public async pipe(
    input: unknown,
    output: Writable | WritableStream<unknown>,
    options?: Partial<ConvertOptions>
  ) {
    if (isWritable(output)) {
      const readable = await READABLE_CONVERTER.convert(input, options);
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
        stream = await READABLE_STREAM_CONVERTER.convert(input);
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

  public toArrayBuffer(input: unknown, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "arraybuffer", options);
    } else {
      return this.convert(input, "arraybuffer", options);
    }
  }

  public toBase64(input: unknown, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "base64", options);
    } else {
      return this.convert(input, "base64", options);
    }
  }

  public toBinary(input: unknown, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "binary", options);
    } else {
      return this.convert(input, "binary", options);
    }
  }

  public toBlob(input: unknown, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "blob", options);
    } else {
      return this.convert(input, "blob", options);
    }
  }

  public toBuffer(input: unknown, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "buffer", options);
    } else {
      return this.convert(input, "buffer", options);
    }
  }

  public toHex(input: unknown, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "hex", options);
    } else {
      return this.convert(input, "hex", options);
    }
  }

  public toReadable(input: unknown, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "readable", options);
    } else {
      return this.convert(input, "readable", options);
    }
  }

  public toReadableStream(input: unknown, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "readablestream", options);
    } else {
      return this.convert(input, "readablestream", options);
    }
  }

  public toText(input: unknown, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "text", options);
    } else {
      return this.convert(input, "text", options);
    }
  }

  public toUint8Array(input: unknown, options?: Partial<ConvertOptions>) {
    if (Array.isArray(input)) {
      return this.merge(input, "uint8array", options);
    } else {
      return this.convert(input, "uint8array", options);
    }
  }

  protected _convert<T extends Type>(
    input: unknown,
    to: T,
    options?: Partial<ConvertOptions>
  ) {
    switch (to) {
      case "arraybuffer":
        return ARRAY_BUFFER_CONVERTER.convert(input, options);
      case "uint8array":
        return UINT8_ARRAY_CONVERTER.convert(input, options);
      case "buffer":
        return BUFFER_CONVERTER.convert(input, options);
      case "blob":
        return BLOB_CONVERTER.convert(input, options);
      case "readable":
        return READABLE_CONVERTER.convert(input, options);
      case "readablestream":
        return READABLE_STREAM_CONVERTER.convert(input, options);
      case "text": {
        const encoding = options?.encoding;
        if (encoding === "base64") {
          return BASE64_CONVERTER.convert(input, options);
        } else if (encoding === "binary") {
          return BINARY_CONVERTER.convert(input, options);
        } else if (encoding === "hex") {
          return HEX_CONVERTER.convert(input, options);
        } else {
          return TEXT_CONVERTER.convert(input, options);
        }
      }
    }

    throw new Error("Illegal output type: " + to);
  }

  protected async _merge<T extends Type>(
    chunks: unknown[],
    to: T,
    options?: Partial<Options>
  ) {
    const results = await this._convertAll(chunks, to, options);

    switch (to) {
      case "arraybuffer":
        return ARRAY_BUFFER_CONVERTER.merge(results as ArrayBuffer[], options);
      case "uint8array":
        return UINT8_ARRAY_CONVERTER.merge(results as Uint8Array[], options);
      case "buffer":
        return BUFFER_CONVERTER.merge(results as Buffer[], options);
      case "blob":
        return BLOB_CONVERTER.merge(results as Blob[], options);
      case "readable":
        return READABLE_CONVERTER.merge(results as Readable[], options);
      case "readablestream":
        return READABLE_STREAM_CONVERTER.merge(
          results as ReadableStream<unknown>[],
          options
        );
      case "text": {
        const strings = results as string[];
        const encoding = options?.encoding;
        if (encoding === "base64") {
          return BASE64_CONVERTER.merge(strings, options);
        } else if (encoding === "binary") {
          return BINARY_CONVERTER.convert(strings, options);
        } else if (encoding === "hex") {
          return HEX_CONVERTER.convert(strings, options);
        } else {
          return TEXT_CONVERTER.convert(strings, options);
        }
      }
    }

    throw new Error("Illegal output type: " + to);
  }

  protected async _convertAll<T extends Type>(
    chunks: unknown[],
    to: T,
    options?: Partial<ConvertOptions>
  ): Promise<ReturnType<T>[]> {
    const results: ReturnType<T>[] = [];
    for (const chunk of chunks) {
      const converted = await this.convert(chunk, to, options);
      results.push(converted);
    }
    return results;
  }
}

export const conv = new Conv();
