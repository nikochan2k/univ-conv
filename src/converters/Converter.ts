export const DEFAULT_BUFFER_SIZE = 96 * 1024;

export interface ConvertOptions {
  chunkSize?: number;
  encoding?: "UTF8" | "BinaryString" | "Base64";
  length?: number;
  start?: number;
}

export interface Converter<T> {
  convert(input: unknown, options?: ConvertOptions): Promise<T>;
  is(input: unknown): input is T;
  merge(chunks: T[]): Promise<T>;
  toArrayBuffer(input: T, chunkSize: number): Promise<ArrayBuffer>;
  toBase64(input: T, chunkSize: number): Promise<string>;
  toText(input: T, chunkSize: number): Promise<string>;
  toUint8Array(input: T, chunkSize: number): Promise<Uint8Array>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function typeOf(input: any): string {
  const type = typeof input;
  if (type === "function" || type === "object") {
    // eslint-disable-next-line
    return input?.constructor?.name;
  }
  return type;
}

export function initOptions(options?: ConvertOptions) {
  if (!options) options = {};
  if (!options.chunkSize) options.chunkSize = DEFAULT_BUFFER_SIZE;
  return options;
}
