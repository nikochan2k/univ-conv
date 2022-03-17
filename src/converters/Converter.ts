export const DEFAULT_BUFFER_SIZE = 96 * 1024;

export interface Options {
  chunkSize: number;
  encoding?: "UTF8" | "BinaryString" | "Base64";
}
export interface ConvertOptions extends Options {
  length?: number;
  start?: number;
}

export interface Converter<T> {
  convert(input: unknown, options?: Partial<ConvertOptions>): Promise<T>;
  is(input: unknown): input is T;
  merge(chunks: T[], options?: Partial<Options>): Promise<T>;
  toArrayBuffer(input: T, chunkSize: number): Promise<ArrayBuffer>;
  toBase64(input: T, chunkSize: number): Promise<string>;
  toText(input: T, chunkSize: number): Promise<string>;
  toUint8Array(input: T, chunkSize: number): Promise<Uint8Array>;
}

export const EMPTY_ARRAY_BUFFER = new ArrayBuffer(0);
export const EMPTY_UINT8_ARRAY = new Uint8Array(0);
export abstract class AbstractConverter<T> implements Converter<T> {
  public async convert(
    input: unknown,
    options?: Partial<ConvertOptions>
  ): Promise<T> {
    if (this.isEmpty(input)) {
      return this.empty();
    }
    if (this.is(input)) {
      return input;
    }

    const converted = await this._convert(input, this.initOptions(options));
    if (converted) {
      return converted;
    }

    throw new Error("Illegal input: " + typeOf(input));
  }

  public merge(chunks: T[], options?: Partial<Options>): Promise<T> {
    if (!chunks || chunks.length === 0) {
      return Promise.resolve(this.empty());
    }
    if (chunks.length === 1) {
      return Promise.resolve(chunks[0] as T);
    }

    return this._merge(chunks, this.initOptions(options));
  }

  public toArrayBuffer(input: T, chunkSize: number): Promise<ArrayBuffer> {
    if (this.isEmpty(input)) {
      return Promise.resolve(EMPTY_ARRAY_BUFFER);
    }
    return this._toArrayBuffer(input, chunkSize);
  }

  public toBase64(input: T, chunkSize: number): Promise<string> {
    if (this.isEmpty(input)) {
      return Promise.resolve("");
    }
    return this._toBase64(input, chunkSize);
  }

  public toText(input: T, chunkSize: number): Promise<string> {
    if (this.isEmpty(input)) {
      return Promise.resolve("");
    }
    return this._toText(input, chunkSize);
  }

  public toUint8Array(input: T, chunkSize: number): Promise<Uint8Array> {
    if (this.isEmpty(input)) {
      return Promise.resolve(EMPTY_UINT8_ARRAY);
    }
    return this._toUint8Array(input, chunkSize);
  }

  public abstract is(input: unknown): input is T;

  protected isEmpty(input: unknown) {
    return !input;
  }

  protected abstract _convert(
    input: unknown,
    options: ConvertOptions
  ): Promise<T | undefined>;
  protected abstract _merge(chunks: T[], options: Options): Promise<T>;
  protected abstract _toArrayBuffer(
    input: T,
    chunkSize: number
  ): Promise<ArrayBuffer>;
  protected abstract _toBase64(input: T, chunkSize: number): Promise<string>;
  protected abstract _toText(input: T, chunkSize: number): Promise<string>;
  protected abstract _toUint8Array(
    input: T,
    chunkSize: number
  ): Promise<Uint8Array>;
  protected abstract empty(): T;

  private initOptions<T extends Options>(options?: Partial<T>): T {
    if (!options) options = {};
    if (options.chunkSize == null) options.chunkSize = DEFAULT_BUFFER_SIZE;
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
