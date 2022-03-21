import type { Readable, Writable } from "stream";

export type CharsetType =
  | "utf8"
  | "utf16le"
  | "utf16be"
  | "jis"
  | "eucjp"
  | "sjis";
export type StringType = "text" | "base64" | "binary" | "hex";
export type BinaryType = "arraybuffer" | "uint8array" | "buffer" | "blob";
export type BlockType = StringType | BinaryType;
export type StreamType = "readable" | "readablestream";
export type Type = BlockType | StreamType;

export type InputType =
  | string
  | ArrayBuffer
  | Uint8Array
  | Buffer
  | Blob
  | Readable
  | ReadableStream<unknown>;

export interface Options {
  chunkSize: number;
  inputEncoding: StringType;
  inputCharset: CharsetType;
  outputCharset: CharsetType;
}
export interface ConvertOptions extends Options {
  length?: number;
  start?: number;
}

export interface Converter<T extends InputType> {
  convert(input: InputType, options?: Partial<ConvertOptions>): Promise<T>;
  merge(chunks: T[], options?: Partial<Options>): Promise<T>;
  toArrayBuffer(input: T, options: ConvertOptions): Promise<ArrayBuffer>;
  toBase64(input: T, options: ConvertOptions): Promise<string>;
  toText(input: T, options: ConvertOptions): Promise<string>;
  toUint8Array(input: T, options: ConvertOptions): Promise<Uint8Array>;
  typeEquals(input: unknown): input is T;
}

export const DEFAULT_BUFFER_SIZE = 96 * 1024;

export let hasBlob = false;
export let hasTextOnBlob = false;
export let hasStreamOnBlob = false;
export let hasArrayBufferOnBlob = false;
export let hasReadAsArrayBufferOnBlob = false;
export let hasReadAsBinaryStringOnBlob = false;
export let EMPTY_BLOB: Blob;
if (typeof Blob === "function") {
  hasBlob = true;
  EMPTY_BLOB = new Blob([]);
  if (Blob.prototype.text != null) {
    hasTextOnBlob = true;
  }
  if (Blob.prototype.stream != null) {
    hasStreamOnBlob = true;
  }
  if (Blob.prototype.arrayBuffer != null) {
    hasArrayBufferOnBlob = true;
  }
  if (navigator?.product !== "ReactNative") {
    hasReadAsArrayBufferOnBlob = FileReader.prototype.readAsArrayBuffer != null;
    hasReadAsBinaryStringOnBlob =
      FileReader.prototype.readAsBinaryString != null;
  }
}

export let hasReadableStream = false;
export let hasWritableStream = false;
export let EMPTY_READABLE_STREAM: ReadableStream<unknown>;
if (typeof ReadableStream === "function") {
  hasReadableStream = true;
  hasWritableStream = true;
  EMPTY_READABLE_STREAM = EMPTY_READABLE_STREAM = new ReadableStream({
    start: (converter) => {
      if (hasBlob) {
        converter.enqueue(EMPTY_BLOB);
      } else {
        converter.enqueue(EMPTY_UINT8_ARRAY);
      }
      converter.close();
    },
  });
}

export let hasBuffer = false;
export let EMPTY_BUFFER: Buffer;
if (typeof Buffer === "function") {
  hasBuffer = true;
  EMPTY_BUFFER = Buffer.alloc(0);
}

/* eslint-disable */
let stream: any;
try {
  stream = require("stream");
} catch {}
/* eslint-enable */

export let hasReadable = false;
export let hasWritable = false;
export let EMPTY_READABLE: Readable;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (typeof stream?.Readable === "function") {
  hasReadable = true;
  hasWritable = true;
  /* eslint-disable */
  EMPTY_READABLE = EMPTY_READABLE = new stream.Readable({
    read() {
      this.push(EMPTY_BUFFER);
      this.push(null);
    },
  });
  /* eslint-enable */
}

export const EMPTY_ARRAY_BUFFER = new ArrayBuffer(0);
export const EMPTY_UINT8_ARRAY = new Uint8Array(0);
export abstract class AbstractConverter<T extends InputType>
  implements Converter<T>
{
  public async convert(
    input: InputType,
    options?: Partial<ConvertOptions>
  ): Promise<T> {
    if (!input) {
      return this.empty();
    }

    const converted = await this._convert(
      input,
      this._initOptions(input, options)
    );
    if (typeof converted !== "undefined") {
      return converted;
    }

    throw new Error(
      `[${this.constructor.name}] Illegal input: ${typeOf(input)}`
    );
  }

  public merge(chunks: T[], options?: Partial<Options>): Promise<T> {
    if (!chunks || chunks.length === 0) {
      return Promise.resolve(this.empty());
    }
    if (chunks.length === 1) {
      return Promise.resolve(chunks[0] as T);
    }

    return this._merge(
      chunks,
      this._initOptions(chunks[0] as InputType, options)
    );
  }

  public toArrayBuffer(
    input: T,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    if (!input || this._isEmpty(input)) {
      return Promise.resolve(EMPTY_ARRAY_BUFFER);
    }
    return this._toArrayBuffer(input, options);
  }

  public toBase64(input: T, options: ConvertOptions): Promise<string> {
    if (!input || this._isEmpty(input)) {
      return Promise.resolve("");
    }
    return this._toBase64(input, options);
  }

  public toText(input: T, options: ConvertOptions): Promise<string> {
    if (!input || this._isEmpty(input)) {
      return Promise.resolve("");
    }
    return this._toText(input, options);
  }

  public toUint8Array(input: T, options: ConvertOptions): Promise<Uint8Array> {
    if (!input || this._isEmpty(input)) {
      return Promise.resolve(EMPTY_UINT8_ARRAY);
    }
    return this._toUint8Array(input, options);
  }

  public abstract typeEquals(input: InputType): input is T;

  protected abstract _convert(
    input: InputType,
    options: ConvertOptions
  ): Promise<T | undefined>;
  protected abstract _isEmpty(input: T): boolean;
  protected abstract _merge(chunks: T[], options: Options): Promise<T>;
  protected abstract _toArrayBuffer(
    input: T,
    options: ConvertOptions
  ): Promise<ArrayBuffer>;
  protected abstract _toBase64(
    input: T,
    options: ConvertOptions
  ): Promise<string>;
  protected abstract _toText(
    input: T,
    options: ConvertOptions
  ): Promise<string>;
  protected abstract _toUint8Array(
    input: T,
    options: ConvertOptions
  ): Promise<Uint8Array>;
  protected abstract empty(): T;

  private _initOptions<T extends Options>(
    input: InputType,
    options?: Partial<ConvertOptions>
  ): ConvertOptions {
    if (!options) options = {};
    if (options.chunkSize == null) options.chunkSize = DEFAULT_BUFFER_SIZE;
    const rem = options.chunkSize % 6;
    if (rem !== 0) {
      options.chunkSize -= rem;
      console.info(
        `"bufferSize" was modified to ${options.chunkSize}. ("bufferSize" must be divisible by 6.)`
      );
    }
    if (typeof input === "string") {
      if (!options.inputEncoding) options.inputEncoding = "text";
    }
    if (!options.inputCharset) options.inputCharset = "utf8";
    if (!options.outputCharset) options.outputCharset = "utf8";
    return options as T;
  }
}

export function typeOf(input: unknown): string {
  const type = typeof input;
  if (type === "function" || type === "object") {
    // eslint-disable-next-line
    return (input as any)?.constructor?.name || String.toString.call(input);
  }
  return type;
}

export function handleFileReader<T extends string | ArrayBuffer>(
  trigger: (reader: FileReader) => void,
  transform: (data: string | ArrayBuffer | null) => T
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = function (ev) {
      reject(reader.error || ev);
    };
    reader.onload = function () {
      resolve(transform(reader.result));
    };
    trigger(reader);
  });
}

export async function handleReadableStream(
  stream: ReadableStream,
  onData: (chunk: InputType) => Promise<void> | void
): Promise<void> {
  const reader = stream.getReader();
  try {
    let res = await reader.read();
    while (!res.done) {
      const chunk = res.value as InputType;
      if (chunk != null) {
        await onData(chunk);
      }
      res = await reader.read();
    }
    reader.cancel().catch((e) => console.debug(e));
  } catch (err) {
    reader.cancel(err).catch((e) => console.debug(e));
    throw err;
  } finally {
    reader.releaseLock();
    stream.cancel().catch((e) => console.debug(e));
  }
}

export function isReadableStream(
  stream: unknown
): stream is ReadableStream<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (
    hasReadableStream &&
    stream != null &&
    typeof (stream as ReadableStream<unknown>).getReader === "function" &&
    typeof (stream as ReadableStream<unknown>).cancel === "function"
  );
}

export function isWritableStream(
  stream: unknown
): stream is WritableStream<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (
    hasWritableStream &&
    stream != null &&
    typeof (stream as WritableStream<unknown>).getWriter === "function" &&
    typeof (stream as WritableStream<unknown>).close === "function"
  );
}

export function isReadable(stream: unknown): stream is Readable {
  return (
    hasReadable &&
    stream != null &&
    typeof (stream as Readable).pipe === "function" &&
    typeof (stream as Readable)._read === "function"
  );
}

export function isWritable(stream: unknown): stream is Writable {
  return (
    hasWritable &&
    stream != null &&
    typeof (stream as Writable).pipe === "function" &&
    typeof (stream as Writable)._write === "function"
  );
}

export function closeStream(
  stream:
    | Readable
    | Writable
    | ReadableStream<unknown>
    | WritableStream<unknown>
    | undefined,
  reason?: unknown
) {
  if (!stream) {
    return;
  }

  if (isReadable(stream) || isWritable(stream)) {
    stream.destroy(reason as Error | undefined);
  } else if (isReadableStream(stream)) {
    const reader = stream.getReader();
    reader.releaseLock();
    reader
      .cancel()
      .catch((e) => console.warn(e))
      .finally(() => {
        // stream.cancel(reason).catch((e) => console.warn(e));
      });
  } else if (isWritableStream(stream)) {
    const writer = stream.getWriter();
    writer.releaseLock();
    writer
      .close()
      .catch((e) => console.warn(e))
      .finally(() => {
        stream.close().catch((e) => console.warn(e));
      });
  }
}

export function dataUrlToBase64(dataUrl: string) {
  const index = dataUrl.indexOf(",");
  if (0 <= index) {
    return dataUrl.substring(index + 1);
  }
  return dataUrl;
}
