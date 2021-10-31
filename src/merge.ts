import { PassThrough, Readable } from "stream";
import { EMPTY_READABLE, EMPTY_READABLE_STREAM } from "./check";
import { handleReadableStream } from "./common";

export function mergeBlob(chunks: Blob[]): Blob {
  if (chunks.length === 1) return chunks[0]!;
  return new Blob(chunks);
}

export function mergeUint8Array(chunks: Uint8Array[]): Uint8Array {
  if (chunks.length === 1) return chunks[0]!;

  const byteLength = chunks.reduce((sum, chunk) => {
    return sum + chunk.byteLength;
  }, 0);

  const u8 = new Uint8Array(byteLength);
  let pos = 0;
  for (const chunk of chunks) {
    u8.set(chunk, pos);
    pos += chunk.byteLength;
  }
  return u8;
}

export function mergeArrayBuffer(chunks: ArrayBuffer[]): ArrayBuffer {
  if (chunks.length === 1) return chunks[0]!;

  const byteLength = chunks.reduce((sum, chunk) => {
    return sum + chunk.byteLength;
  }, 0);

  const u8 = new Uint8Array(byteLength);
  let pos = 0;
  for (const chunk of chunks) {
    u8.set(new Uint8Array(chunk), pos);
    pos += chunk.byteLength;
  }
  return u8.buffer;
}

export function mergeBuffer(chunks: Buffer[]): Buffer {
  if (chunks.length === 1) return chunks[0]!;
  return Buffer.concat(chunks);
}

export function mergeString(chunks: string[]): string {
  if (chunks.length === 1) return chunks[0]!;
  return chunks.reduce((sum, chunk) => {
    return sum + chunk;
  }, "");
}

export function mergeReadables(chunks: Readable[]): Readable {
  if (!chunks || chunks.length === 0) return EMPTY_READABLE;
  if (chunks.length === 1) return chunks[0]!;

  let pass = new PassThrough();
  let waiting = chunks.length;
  for (let chunk of chunks) {
    pass = chunk.pipe(pass, { end: false });
    chunk.once("end", () => --waiting === 0 && pass.end());
  }
  return pass;
}

export function mergeReadableStream(
  chunks: ReadableStream<any>[]
): ReadableStream<any> {
  if (!chunks || chunks.length === 0) return EMPTY_READABLE_STREAM;
  if (chunks.length === 1) return chunks[0]!;

  return new ReadableStream({
    start: async (converter) => {
      for (const chunk of chunks) {
        try {
          await handleReadableStream(chunk, async (chunk) => {
            converter.enqueue(chunk);
          });
        } catch (e) {
          converter.close();
          converter.error(e);
        }
      }
      converter.close();
    },
  });
}
