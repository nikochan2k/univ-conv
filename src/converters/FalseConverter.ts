import { ConvertOptions, Converter } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export class FalseConverter implements Converter<any> {
  public constructor(public key: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public convert(_1: unknown, _2: ConvertOptions): any {
    throw new Error("convert method not implemented: " + this.key);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public merge(_1: any[], _2: ConvertOptions): Promise<any> {
    throw new Error("merge method not implemented: " + this.key);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toArrayBuffer(_1: any, _2: ConvertOptions): Promise<ArrayBuffer> {
    throw new Error("toArrayBuffer method not implemented: " + this.key);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toBase64(_1: any, _2: ConvertOptions): Promise<string> {
    throw new Error("toBase64 method not implemented: " + this.key);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toText(_1: any, _2: ConvertOptions): Promise<string> {
    throw new Error("toText method not implemented: " + this.key);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toUint8Array(_1: any, _2: ConvertOptions): Promise<Uint8Array> {
    throw new Error("toUint8Array method not implemented: " + this.key);
  }

  public typeEquals(_: unknown): _ is any {
    return false;
  }
}
