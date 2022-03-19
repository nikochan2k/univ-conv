/* eslint-disable @typescript-eslint/no-explicit-any */
import { Converter, Encoding } from "./Converter";

const NOT_IMPLEMENTED_ERROR = new Error("Method not implemented.");

class FalseConverter implements Converter<any> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public convert(_: unknown): any {
    throw NOT_IMPLEMENTED_ERROR;
  }

  public is(input: unknown): input is any {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public merge(_: any[]): Promise<any> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toArrayBuffer(_1: any, _2: number): Promise<ArrayBuffer> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toBase64(_1: any, _2: number): Promise<string> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toText(_1: any, _2: Encoding, _3: number): Promise<string> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toUint8Array(_1: any, _2: number): Promise<Uint8Array> {
    throw NOT_IMPLEMENTED_ERROR;
  }
}

export const FALSE_CONVERTER = new FalseConverter();
