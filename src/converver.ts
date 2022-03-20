import type { Readable, Writable } from "stream";
import {
  ARRAY_BUFFER_CONVERTER,
  BASE64_CONVERTER,
  BINARY_STRING_CONVERTER,
  BLOB_CONVERTER,
  BUFFER_CONVERTER,
  hasReadable,
  hasReadableStream,
  hasWritable,
  READABLE_CONVERTER,
  READABLE_STREAM_CONVERTER,
  UINT8_ARRAY_CONVERTER,
  TEXT_CONVERTER,
  ReturnType,
  Type,
  ConvertOptions,
  Options,
  HEX_CONVERTER,
} from "./converters";
import { handleReadableStream } from "./converters/ReadableStreamConverter";

export function convert<T extends Type>(
  input: unknown,
  to: T,
  options?: Partial<ConvertOptions>
): Promise<ReturnType<T>> {
  switch (to) {
    case "arraybuffer":
      return ARRAY_BUFFER_CONVERTER.convert(input, options) as Promise<
        ReturnType<T>
      >;
    case "uint8array":
      return UINT8_ARRAY_CONVERTER.convert(input, options) as Promise<
        ReturnType<T>
      >;
    case "buffer":
      return BUFFER_CONVERTER.convert(input, options) as Promise<ReturnType<T>>;
    case "blob":
      return BLOB_CONVERTER.convert(input, options) as Promise<ReturnType<T>>;
    case "readable":
      return READABLE_CONVERTER.convert(input, options) as Promise<
        ReturnType<T>
      >;
    case "readablestream":
      return READABLE_STREAM_CONVERTER.convert(input, options) as Promise<
        ReturnType<T>
      >;
  }

  const encoding = options?.encoding;
  if (encoding === "base64") {
    return BASE64_CONVERTER.convert(input, options) as Promise<ReturnType<T>>;
  } else if (encoding === "binary") {
    return BINARY_STRING_CONVERTER.convert(input, options) as Promise<
      ReturnType<T>
    >;
  } else if (encoding === "hex") {
    return HEX_CONVERTER.convert(input, options) as Promise<ReturnType<T>>;
  } else {
    return TEXT_CONVERTER.convert(input, options) as Promise<ReturnType<T>>;
  }
}

async function convertAll<T extends Type>(
  chunks: unknown[],
  to: T,
  options?: Partial<ConvertOptions>
): Promise<ReturnType<T>[]> {
  const results: ReturnType<T>[] = [];
  for (const chunk of chunks) {
    const converted = await convert(chunk, to, options);
    results.push(converted);
  }
  return results;
}

export async function merge<T extends Type>(
  chunks: unknown[],
  to: T,
  options?: Partial<Options>
): Promise<ReturnType<T>> {
  const results = await convertAll(chunks, to, options);

  switch (to) {
    case "arraybuffer":
      return ARRAY_BUFFER_CONVERTER.merge(
        results as ArrayBuffer[],
        options
      ) as Promise<ReturnType<T>>;
    case "uint8array":
      return UINT8_ARRAY_CONVERTER.merge(
        chunks as Uint8Array[],
        options
      ) as Promise<ReturnType<T>>;
    case "buffer":
      return BUFFER_CONVERTER.merge(results as Buffer[], options) as Promise<
        ReturnType<T>
      >;
    case "blob":
      return BLOB_CONVERTER.merge(results as Blob[], options) as Promise<
        ReturnType<T>
      >;
    case "readable":
      return READABLE_CONVERTER.merge(
        results as Readable[],
        options
      ) as Promise<ReturnType<T>>;
    case "readablestream":
      return READABLE_STREAM_CONVERTER.merge(
        results as ReadableStream<unknown>[],
        options
      ) as Promise<ReturnType<T>>;
  }

  const strings = results as string[];
  const encoding = options?.encoding;
  if (encoding === "base64") {
    return BASE64_CONVERTER.merge(strings, options) as Promise<ReturnType<T>>;
  } else if (encoding === "binary") {
    return BINARY_STRING_CONVERTER.convert(strings, options) as Promise<
      ReturnType<T>
    >;
  } else if (encoding === "hex") {
    return HEX_CONVERTER.convert(strings, options) as Promise<ReturnType<T>>;
  } else {
    return TEXT_CONVERTER.convert(strings, options) as Promise<ReturnType<T>>;
  }
}

export async function pipe(
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
  } else {
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
}

function isReadableStream(stream: unknown): stream is ReadableStream<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (
    hasReadableStream &&
    stream != null &&
    typeof (stream as ReadableStream<unknown>).getReader === "function" &&
    typeof (stream as ReadableStream<unknown>).cancel === "function"
  );
}

/*
function isWritableStream(stream: unknown): stream is WritableStream<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (
    hasWritableStream &&
    stream != null &&
    typeof (stream as WritableStream<unknown>).getWriter === "function" &&
    typeof (stream as WritableStream<unknown>).close === "function"
  );
}
*/

function isReadable(stream: unknown): stream is Readable {
  return (
    hasReadable &&
    stream != null &&
    typeof (stream as Readable).pipe === "function" &&
    typeof (stream as Readable)._read === "function"
  );
}

function isWritable(stream: unknown): stream is Writable {
  return (
    hasWritable &&
    stream != null &&
    typeof (stream as Writable).pipe === "function" &&
    typeof (stream as Writable)._write === "function"
  );
}

function closeStream(
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
        stream.cancel(reason).catch((e) => console.warn(e));
      });
  } else {
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
