import { PassThrough, Readable } from "stream";
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
  const end = readables.length;
  if (!readables || end === 0) {
    return EMPTY_READABLE;
  }
  if (end === 1) {
    return readables[0] as Readable;
  }

  const pt = new PassThrough();
  const process = (i: number) => {
    if (i < end) {
      const readable = readables[i] as Readable;
      readable.pipe(pt, { end: false });
      readable.once("error", (e) => {
        readable.unpipe();
        pt.emit("error", e);
        for (let j = i; j < end; j++) {
          const r = readables[j] as Readable;
          r.destroy();
        }
      });
      readable.once("end", () => process(++i));
    } else {
      pt.emit("end");
    }
  };
  process(0);
  return pt;
}

export function mergeReadableStream(
  streams: ReadableStream<unknown>[]
): ReadableStream<unknown> {
  const end = streams.length;
  if (!streams || end === 0) {
    return EMPTY_READABLE_STREAM;
  }
  if (end === 1) {
    return streams[0] as ReadableStream<unknown>;
  }

  const process = (converter: ReadableStreamController<unknown>, i: number) => {
    if (i < end) {
      const stream = streams[i] as ReadableStream<unknown>;
      handleReadableStream(stream, (chunk) => converter.enqueue(chunk))
        .then(() => process(converter, ++i))
        .catch((e) => {
          converter.error(e);
          for (let j = i; j < end; j++) {
            const s = streams[j] as ReadableStream<unknown>;
            s.cancel(); // eslint-disable-line
          }
        });
    } else {
      converter.close();
    }
  };

  return new ReadableStream({
    start: (converter) => {
      process(converter, 0);
    },
  });
}
