import { conv as c } from "../converver";
import {
  hasBlob,
  hasBuffer,
  hasReadable,
  hasReadableStream,
} from "../converters";

it("ArrayBuffer", async () => {
  const expected = "大谷翔平ホームラン";
  const ab = await c.toArrayBuffer(expected);

  {
    const actual = await c.toText(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c.toUint8Array(ab);
    const actual = await c.toText(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c.toBlob(ab);
    const actual = await c.toText(blob);
    expect(actual).toBe(expected);
  }

  if (hasBuffer) {
    const buf = await c.toBuffer(ab);
    const actual = await c.toText(buf);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c.toBase64(ab);
    const actual = await c.toText(base64);
    expect(actual).toBe(expected);
  }

  {
    const binaryString = await c.toBinary(ab);
    const actual = await c.toText(binaryString);
    expect(actual).toBe(expected);
  }
});

it("Uint8Array", async () => {
  const expected = "大谷翔平ホームラン";
  const u8 = await c.toUint8Array(expected);

  {
    const actual = await c.toText(u8);
    expect(actual).toBe(expected);
  }

  {
    const ab = await c.toArrayBuffer(u8);
    const actual = await c.toText(ab);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c.toBlob(u8);
    const actual = await c.toText(blob);
    expect(actual).toBe(expected);
  }

  if (hasBuffer) {
    const buf = await c.toBuffer(u8);
    const actual = await c.toText(buf);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c.toBase64(u8);
    const actual = await c.toText(base64);
    expect(actual).toBe(expected);
  }

  {
    const binaryString = await c.toBinary(u8);
    const actual = await c.toText(binaryString);
    expect(actual).toBe(expected);
  }
});

it("Buffer", async () => {
  if (!hasBuffer) {
    return;
  }

  const expected = "大谷翔平ホームラン";
  const buffer = await c.toBuffer(expected);

  {
    const actual = await c.toText(buffer);
    expect(actual).toBe(expected);
  }

  {
    const ab = await c.toArrayBuffer(buffer);
    const actual = await c.toText(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c.toUint8Array(buffer);
    const actual = await c.toText(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c.toBlob(buffer);
    const actual = await c.toText(blob);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c.toBase64(buffer);
    const actual = await c.toText(base64);
    expect(actual).toBe(expected);
  }

  {
    const binaryString = await c.toBinary(buffer);
    const actual = await c.toText(binaryString);
    expect(actual).toBe(expected);
  }
});

it("Blob", async () => {
  if (!hasBlob) {
    return;
  }

  const expected = "大谷翔平ホームラン";
  const blob = await c.toBlob(expected);

  {
    const actual = await c.toText(blob);
    expect(actual).toBe(expected);
  }

  {
    const ab = await c.toArrayBuffer(blob);
    const actual = await c.toText(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c.toUint8Array(blob);
    const actual = await c.toText(u8);
    expect(actual).toBe(expected);
  }

  if (hasBuffer) {
    const buffer = await c.toBuffer(blob);
    const actual = await c.toText(buffer);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c.toBase64(blob);
    const actual = await c.toText(base64);
    expect(actual).toBe(expected);
  }

  {
    const binaryString = await c.toBinary(blob);
    const actual = await c.toText(binaryString);
    expect(actual).toBe(expected);
  }
});

it("Base64", async () => {
  const expected = "大谷翔平ホームラン";
  const base64 = await c.toBase64(expected);

  {
    const actual = await c.toText(base64);
    expect(actual).toBe(expected);
  }

  {
    const ab = await c.toArrayBuffer(base64);
    const actual = await c.toText(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c.toUint8Array(base64);
    const actual = await c.toText(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c.toBlob(base64);
    const actual = await c.toText(blob);
    expect(actual).toBe(expected);
  }

  if (hasBuffer) {
    const buf = await c.toBuffer(base64);
    const actual = await c.toText(buf);
    expect(actual).toBe(expected);
  }

  {
    const binaryString = await c.toBinary(base64);
    const actual = await c.toText(binaryString);
    expect(actual).toBe(expected);
  }
});

it("BinaryString", async () => {
  const expected = "大谷翔平ホームラン";
  const binaryString = await c.toBinary(expected);

  {
    const actual = await c.toText(binaryString);
    expect(actual).toBe(expected);
  }

  {
    const ab = await c.toArrayBuffer(binaryString);
    const actual = await c.toText(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c.toUint8Array(binaryString);
    const actual = await c.toText(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c.toBlob(binaryString);
    const actual = await c.toText(blob);
    expect(actual).toBe(expected);
  }

  if (hasBuffer) {
    const buf = await c.toBuffer(binaryString);
    const actual = await c.toText(buf);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c.toBase64(binaryString);
    const actual = await c.toText(base64);
    expect(actual).toBe(expected);
  }
});

it("Readable", async () => {
  if (!hasReadable) {
    return;
  }

  const expected = "大谷翔平ホームラン";

  {
    const readable = await c.toReadable(expected);
    const actual = await c.toText(readable);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c.toReadable(expected);
    const ab = await c.toArrayBuffer(readable);
    const actual = await c.toText(ab);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c.toReadable(expected);
    const u8 = await c.toUint8Array(readable);
    const actual = await c.toText(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const readable = await c.toReadable(expected);
    const blob = await c.toBlob(readable);
    const actual = await c.toText(blob);
    expect(actual).toBe(expected);
  }

  if (hasBuffer) {
    const readable = await c.toReadable(expected);
    const buf = await c.toBuffer(readable);
    const actual = await c.toText(buf);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c.toReadable(expected);
    const base64 = await c.toBase64(readable);
    const actual = await c.toText(base64);
    expect(actual).toBe(expected);
  }
});

it("ReadableStream", async () => {
  if (!hasReadableStream) {
    return;
  }

  const expected = "大谷翔平ホームラン";

  {
    const readable = await c.toReadableStream(expected);
    const actual = await c.toText(readable);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c.toReadableStream(expected);
    const ab = await c.toArrayBuffer(readable);
    const actual = await c.toText(ab);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c.toReadableStream(expected);
    const u8 = await c.toUint8Array(readable);
    const actual = await c.toText(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const readable = await c.toReadableStream(expected);
    const blob = await c.toBlob(readable);
    const actual = await c.toText(blob);
    expect(actual).toBe(expected);
  }

  if (hasBuffer) {
    const readable = await c.toReadableStream(expected);
    const buf = await c.toBuffer(readable);
    const actual = await c.toText(buf);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c.toReadableStream(expected);
    const base64 = await c.toBase64(readable);
    const actual = await c.toText(base64);
    expect(actual).toBe(expected);
  }
});
