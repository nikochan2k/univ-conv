import { decode, encode } from "base64-arraybuffer";
import { Readable } from "stream";
import { EMPTY_ARRAY_BUFFER, EMPTY_BUFFER } from ".";
import { EMPTY_U8, isReadableStream } from "./check";
import { ReadableStreamData } from "./def";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const DEFAULT_BUFFER_SIZE = 96 * 1024;

export function uint8ArrayToText(u8: Uint8Array): string {
  if (u8.byteLength === 0) {
    return "";
  }

  return textDecoder.decode(u8);
}

export function uint8ArrayToBuffer(u8: Uint8Array): Buffer {
  if (u8.length === 0) {
    return EMPTY_BUFFER;
  }

  return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
}

export function textToUint8Array(text: string): Uint8Array {
  if (!text) {
    return EMPTY_U8;
  }

  return textEncoder.encode(text);
}

export function bufferToBase64(buffer: Buffer): string {
  if (buffer.byteLength === 0) {
    return "";
  }

  return buffer.toString("base64");
}

export function bufferToBinaryString(buffer: Buffer): string {
  if (buffer.byteLength === 0) {
    return "";
  }

  return buffer.toString("binary");
}

export function uint8ArrayToBinaryString(u8: Uint8Array): string {
  if (u8.byteLength === 0) {
    return "";
  }

  return Array.from(u8, (e) => String.fromCharCode(e)).join("");
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (buffer.byteLength === 0) {
    return "";
  }

  return encode(buffer);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (!base64) {
    return EMPTY_ARRAY_BUFFER;
  }

  return decode(base64);
}

export function base64ToBuffer(base64: string): Buffer {
  if (!base64) {
    return EMPTY_BUFFER;
  }

  return Buffer.from(base64, "base64");
}

export function binaryStringToBuffer(bin: string): Buffer {
  if (!bin) {
    return EMPTY_BUFFER;
  }

  return Buffer.from(bin, "binary");
}

export function binaryStringToUint8Array(bin: string): Uint8Array {
  if (!bin) {
    return EMPTY_BUFFER;
  }

  return Uint8Array.from(bin.split(""), (e) => e.charCodeAt(0));
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
  onData: (chunk: unknown) => Promise<void> | void
): Promise<void> {
  const reader = stream.getReader();
  try {
    let res = await reader.read();
    while (!res.done) {
      const chunk = res.value as unknown;
      if (chunk != null) {
        await onData(chunk);
      }
      res = await reader.read();
    }
    await reader.cancel();
  } catch (err) {
    await reader.cancel(err);
    throw err;
  }
}

export async function handleReadable(
  readable: Readable,
  onData: (chunk: unknown) => Promise<void> | void
): Promise<void> {
  if (readable.destroyed) {
    return;
  }
  return new Promise<void>((resolve, reject) => {
    readable.on("error", (e) => reject(e));
    readable.on("end", () => resolve());
    readable.on("data", (chunk) => void (async () => await onData(chunk))());
  });
}

export async function handleReadableStreamData(
  data: ReadableStreamData,
  onData: (chunk: unknown) => Promise<void>
): Promise<void> {
  if (isReadableStream(data)) {
    return handleReadableStream(data, onData);
  } else {
    return handleReadable(data, onData);
  }
}

export function dataUrlToBase64(dataUrl: string) {
  const index = dataUrl.indexOf(",");
  if (0 <= index) {
    return dataUrl.substr(index + 1);
  }
  return dataUrl;
}

export async function blobToBase64(
  blob: Blob,
  bufferSize = DEFAULT_BUFFER_SIZE
): Promise<string> {
  if (blob.size === 0) {
    return "";
  }

  const chunks: string[] = [];
  for (let start = 0, end = blob.size; start < end; start += bufferSize) {
    const blobChunk = blob.slice(start, start + bufferSize);
    const chunk: string = await handleFileReader(
      (reader) => reader.readAsDataURL(blobChunk),
      (data) => dataUrlToBase64(data as string)
    );
    chunks.push(chunk);
  }
  return chunks.join("");
}

export async function blobToBinaryString(
  blob: Blob,
  bufferSize = DEFAULT_BUFFER_SIZE
): Promise<string> {
  if (blob.size === 0) {
    return "";
  }

  const chunks: string[] = [];
  for (let start = 0, end = blob.size; start < end; start += bufferSize) {
    const blobChunk = blob.slice(start, start + bufferSize);
    const chunk: string = await handleFileReader(
      (reader) => reader.readAsBinaryString(blobChunk),
      (data) => data as string
    );
    chunks.push(chunk);
  }
  return chunks.join("");
}

export async function blobToUint8Array(
  blob: Blob,
  bufferSize = DEFAULT_BUFFER_SIZE
) {
  if (blob.size === 0) {
    return EMPTY_U8;
  }

  let byteLength = 0;
  const chunks: ArrayBuffer[] = [];
  for (let start = 0, end = blob.size; start < end; start += bufferSize) {
    const blobChunk = blob.slice(start, start + bufferSize);
    const chunk: ArrayBuffer = await handleFileReader(
      (reader) => reader.readAsArrayBuffer(blobChunk),
      (data) => {
        const chunk = data as ArrayBuffer;
        byteLength += chunk.byteLength;
        return chunk;
      }
    );
    chunks.push(chunk);
  }

  const u8 = new Uint8Array(byteLength);
  let pos = 0;
  for (const chunk of chunks) {
    u8.set(new Uint8Array(chunk), pos);
    pos += chunk.byteLength;
  }
  return u8;
}
