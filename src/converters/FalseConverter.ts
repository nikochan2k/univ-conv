/* eslint-disable @typescript-eslint/no-explicit-any */
import { Converter } from "./Converter";

class FalseConverter implements Converter<any> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public convert(_: unknown): any {
    throw new Error("Method not implemented.");
  }

  public is(input: unknown): input is any {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public merge(_: any[]): Promise<any> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toArrayBuffer(_1: any, _2: number): Promise<ArrayBuffer> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toBase64(_1: any, _2: number): Promise<string> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toText(_1: any, _2: number): Promise<string> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toUint8Array(_1: any, _2: number): Promise<Uint8Array> {
    throw new Error("Method not implemented.");
  }
}

export const FALSE_CONVERTER = new FalseConverter();
