import { Readable } from "stream";
import {
  EMPTY_ARRAY_BUFFER,
  EMPTY_BLOB,
  EMPTY_BUFFER,
  EMPTY_U8,
  StringData,
  StringEncoding,
} from ".";
import { EMPTY_READABLE, EMPTY_READABLE_STREAM } from "./check";
import { handleReadableStream } from "./common";

export function mergeBlob(chunks: Blob[]): Blob {
  if (chunks.length === 0) {
    return EMPTY_BLOB;
  }
  if (chunks.length === 1) {
    return chunks[0] as Blob;
  }

  return new Blob(chunks);
}

export function mergeUint8Array(chunks: Uint8Array[]): Uint8Array {
  if (chunks.length === 0) {
    return EMPTY_U8;
  }
  if (chunks.length === 1) {
    return chunks[0] as Uint8Array;
  }

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
  if (chunks.length === 0) {
    return EMPTY_ARRAY_BUFFER;
  }
  if (chunks.length === 1) {
    return chunks[0] as ArrayBuffer;
  }

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
  if (chunks.length === 0) {
    return EMPTY_BUFFER;
  }
  if (chunks.length === 1) {
    return chunks[0] as Buffer;
  }

  return Buffer.concat(chunks);
}

export function mergeStringData(
  chunks: StringData[],
  encoding: StringEncoding
): StringData {
  const data: StringData = { value: "", encoding };
  if (chunks.length === 0) {
    return data;
  }
  if (chunks.length === 1) {
    return chunks[0] as StringData;
  }

  data.value = chunks.reduce((sum, chunk) => {
    return sum + chunk.value;
  }, "");
  return data;
}

export function mergeString(chunks: string[]): string {
  if (chunks.length === 1) {
    return chunks[0] as string;
  }

  return chunks.reduce((sum, chunk) => {
    return sum + chunk;
  }, "");
}

export function mergeReadables(readables: Readable[]): Readable {
  if (!readables || readables.length === 0) {
    return EMPTY_READABLE;
  }
  if (readables.length === 1) {
    return readables[0] as Readable;
  }

  return new Readable({
    read: async function () {
      for (const readable of readables) {
        const result = await new Promise<boolean>((resolve) => {
          readable.on("error", (err) => {
            this.emit("error", err);
            resolve(false);
          });
          readable.on("end", () => resolve(true));
          readable.on("data", (data) => this.push(data));
        });
        if (!result) {
          return;
        }
      }
      this.push(null);
    },
  });
}

export function mergeReadableStream(
  chunks: ReadableStream<unknown>[]
): ReadableStream<unknown> {
  if (!chunks || chunks.length === 0) {
    return EMPTY_READABLE_STREAM;
  }
  if (chunks.length === 1) {
    return chunks[0] as ReadableStream<unknown>;
  }

  return new ReadableStream({
    start: async (converter) => {
      for (const chunk of chunks) {
        try {
          await handleReadableStream(chunk, (chunk) =>
            converter.enqueue(chunk)
          );
        } catch (e) {
          converter.close();
          converter.error(e);
        }
      }
      converter.close();
    },
  });
}
