import { Converter, ConvertOptions, Options } from "./core";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
export class FalseConverter implements Converter<any> {
  public constructor(public key: string) {}

  public convert(_1: unknown, _2?: ConvertOptions): any {
    throw new Error("convert method not implemented: " + this.key);
  }

  public empty(): any {
    throw new Error("Method not implemented.");
  }

  public getSize(_1: any, _2?: Partial<Options>): Promise<number> {
    throw new Error("getSize method not implemented: " + this.key);
  }

  public getStartEnd(
    _1: any,
    _2: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    throw new Error("Method not implemented.");
  }

  public merge(_1: any[], _2?: ConvertOptions): Promise<any> {
    throw new Error("merge method not implemented: " + this.key);
  }

  public toArrayBuffer(_1: any, _2: ConvertOptions): Promise<ArrayBuffer> {
    throw new Error("toArrayBuffer method not implemented: " + this.key);
  }

  public toBase64(_1: any, _2: ConvertOptions): Promise<string> {
    throw new Error("toBase64 method not implemented: " + this.key);
  }

  public toText(_1: any, _2: ConvertOptions): Promise<string> {
    throw new Error("toText method not implemented: " + this.key);
  }

  public toUint8Array(_1: any, _2: ConvertOptions): Promise<Uint8Array> {
    throw new Error("toUint8Array method not implemented: " + this.key);
  }

  public typeEquals(_: unknown): _ is any {
    return false;
  }
}
