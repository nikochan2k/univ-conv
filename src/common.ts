import { decode, encode } from "base64-arraybuffer";
import { Readable } from "stream";
import { EMPTY_U8 } from "./check";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const DEFAULT_BUFFER_SIZE = 96 * 1024;

export async function uint8ArrayToText(u8: Uint8Array) {
  return textDecoder.decode(u8);
}

export async function textToUint8Array(text: string) {
  return textEncoder.encode(text);
}

export async function bufferToBase64(buffer: Buffer) {
  return buffer.toString("base64");
}

export async function bufferToBinaryString(buffer: Buffer) {
  return buffer.toString("binary");
}

export async function uint8ArrayToBinaryString(u8: Uint8Array) {
  return Array.from(u8, (e) => String.fromCharCode(e)).join("");
}

export async function arrayBufferToBase64(buffer: ArrayBuffer) {
  return encode(buffer);
}

export async function base64ToArrayBuffer(base64: string) {
  return decode(base64);
}

export async function base64ToBuffer(base64: string) {
  return Buffer.from(base64, "base64");
}

export async function binaryStringToBuffer(bin: string) {
  return Buffer.from(bin, "binary");
}

export function handleFileReader<T extends string | ArrayBuffer>(
  trigger: (reader: FileReader) => void,
  transform: (data: any) => any
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
  onData: (chunk: any) => Promise<void>
): Promise<void> {
  const reader = stream.getReader();
  try {
    let res = await reader.read();
    while (!res.done) {
      const chunk = res.value;
      if (chunk != null) {
        await onData(chunk);
      }
      res = await reader.read();
    }
    reader.cancel();
  } catch (err) {
    reader.cancel(err);
    throw err;
  }
}

export async function handleReadable(
  readable: Readable,
  onData: (chunk: any) => Promise<void>
): Promise<void> {
  if (readable.destroyed) {
    return;
  }
  return new Promise<void>((resolve, reject) => {
    readable.on("error", (e) => reject(e));
    readable.on("end", () => resolve());
    readable.on("data", (chunk) => onData(chunk));
  });
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
      (data) => data
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
