/* eslint-disable @typescript-eslint/no-explicit-any */
import { Converter, ConvertOptions } from "./Converter";

const NOT_IMPLEMENTED_ERROR = new Error("Method not implemented.");

class FalseConverter implements Converter<any> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public convert(_1: unknown, _2: ConvertOptions): any {
    throw NOT_IMPLEMENTED_ERROR;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public merge(_1: any[], _2: ConvertOptions): Promise<any> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toArrayBuffer(_1: any, _2: ConvertOptions): Promise<ArrayBuffer> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toBase64(_1: any, _2: ConvertOptions): Promise<string> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toText(_1: any, _2: ConvertOptions): Promise<string> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toUint8Array(_1: any, _2: ConvertOptions): Promise<Uint8Array> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  public typeEquals(_: unknown): _ is any {
    return false;
  }
}

export const FALSE_CONVERTER = new FalseConverter();
