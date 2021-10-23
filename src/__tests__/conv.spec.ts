import { converter as c, hasBlob, hasBuffer } from "../";

test("util/binary ArrayBuffer", async () => {
  const expected = "大谷翔平ホームラン";
  const ab = await c.toArrayBuffer(expected);

  {
    const actual = await c.toText(ab);
    expect(expected).toBe(actual);
  }

  {
    const u8 = await c.toUint8Array(ab);
    const actual = await c.toText(u8);
    expect(expected).toBe(actual);
  }

  if (hasBlob) {
    const blob = await c.toBlob(ab);
    const actual = await c.toText(blob);
    expect(expected).toBe(actual);
  }

  if (hasBuffer) {
    const buf = await c.toBuffer(ab);
    const actual = await c.toText(buf);
    expect(expected).toBe(actual);
  }

  {
    const base64 = await c.toBase64(ab);
    const actual = await c.toText({ value: base64, encoding: "Base64" });
    expect(expected).toBe(actual);
  }

  {
    const binaryString = await c.toBinaryString(ab);
    const actual = await c.toText({
      value: binaryString,
      encoding: "BinaryString",
    });
    expect(expected).toBe(actual);
  }
});

test("util/binary Uint8Array", async () => {
  const expected = "大谷翔平ホームラン";
  const u8 = await c.toUint8Array(expected);

  {
    const actual = await c.toText(u8);
    expect(expected).toBe(actual);
  }

  {
    const ab = await c.toArrayBuffer(u8);
    const actual = await c.toText(ab);
    expect(expected).toBe(actual);
  }

  if (hasBlob) {
    const blob = await c.toBlob(u8);
    const actual = await c.toText(blob);
    expect(expected).toBe(actual);
  }

  if (hasBuffer) {
    const buf = await c.toBuffer(u8);
    const actual = await c.toText(buf);
    expect(expected).toBe(actual);
  }

  {
    const base64 = await c.toBase64(u8);
    const actual = await c.toText({ value: base64, encoding: "Base64" });
    expect(expected).toBe(actual);
  }

  {
    const binaryString = await c.toBinaryString(u8);
    const actual = await c.toText({
      value: binaryString,
      encoding: "BinaryString",
    });
    expect(expected).toBe(actual);
  }
});

test("util/binary Buffer", async () => {
  if (!hasBuffer) {
    return;
  }

  const expected = "大谷翔平ホームラン";
  const buffer = await c.toBuffer(expected);

  {
    const actual = await c.toText(buffer);
    expect(expected).toBe(actual);
  }

  {
    const ab = await c.toArrayBuffer(buffer);
    const actual = await c.toText(ab);
    expect(expected).toBe(actual);
  }

  {
    const u8 = await c.toUint8Array(buffer);
    const actual = await c.toText(u8);
    expect(expected).toBe(actual);
  }

  if (hasBlob) {
    const blob = await c.toBlob(buffer);
    const actual = await c.toText(blob);
    expect(expected).toBe(actual);
  }

  {
    const base64 = await c.toBase64(buffer);
    const actual = await c.toText({ value: base64, encoding: "Base64" });
    expect(expected).toBe(actual);
  }

  {
    const binaryString = await c.toBinaryString(buffer);
    const actual = await c.toText({
      value: binaryString,
      encoding: "BinaryString",
    });
    expect(expected).toBe(actual);
  }
});

test("util/binary Blob", async () => {
  if (!hasBlob) {
    return;
  }

  const expected = "大谷翔平ホームラン";
  const blob = await c.toBlob(expected);

  {
    const actual = await c.toText(blob);
    expect(expected).toBe(actual);
  }

  {
    const ab = await c.toArrayBuffer(blob);
    const actual = await c.toText(ab);
    expect(expected).toBe(actual);
  }

  {
    const u8 = await c.toUint8Array(blob);
    const actual = await c.toText(u8);
    expect(expected).toBe(actual);
  }

  if (hasBuffer) {
    const buffer = await c.toBuffer(blob);
    const actual = await c.toText(buffer);
    expect(expected).toBe(actual);
  }

  {
    const base64 = await c.toBase64(blob);
    const actual = await c.toText({ value: base64, encoding: "Base64" });
    expect(expected).toBe(actual);
  }

  {
    const binaryString = await c.toBinaryString(blob);
    const actual = await c.toText({
      value: binaryString,
      encoding: "BinaryString",
    });
    expect(expected).toBe(actual);
  }
});

test("util/binary Base64", async () => {
  const expected = "大谷翔平ホームラン";
  const base64 = await c.toBase64(expected);

  {
    const actual = await c.toText({ value: base64, encoding: "Base64" });
    expect(expected).toBe(actual);
  }

  {
    const ab = await c.toArrayBuffer({ value: base64, encoding: "Base64" });
    const actual = await c.toText(ab);
    expect(expected).toBe(actual);
  }

  {
    const u8 = await c.toUint8Array({ value: base64, encoding: "Base64" });
    const actual = await c.toText(u8);
    expect(expected).toBe(actual);
  }

  if (hasBlob) {
    const blob = await c.toBlob({ value: base64, encoding: "Base64" });
    const actual = await c.toText(blob);
    expect(expected).toBe(actual);
  }

  if (hasBuffer) {
    const buf = await c.toBuffer({ value: base64, encoding: "Base64" });
    const actual = await c.toText(buf);
    expect(expected).toBe(actual);
  }

  {
    const binaryString = await c.toBinaryString({
      value: base64,
      encoding: "Base64",
    });
    const actual = await c.toText({
      value: binaryString,
      encoding: "BinaryString",
    });
    expect(expected).toBe(actual);
  }
});

test("util/binary BinaryString", async () => {
  const expected = "大谷翔平ホームラン";
  const binaryString = await c.toBinaryString(expected);

  {
    const actual = await c.toText({
      value: binaryString,
      encoding: "BinaryString",
    });
    expect(expected).toBe(actual);
  }

  {
    const ab = await c.toArrayBuffer({
      value: binaryString,
      encoding: "BinaryString",
    });
    const actual = await c.toText(ab);
    expect(expected).toBe(actual);
  }

  {
    const u8 = await c.toUint8Array({
      value: binaryString,
      encoding: "BinaryString",
    });
    const actual = await c.toText(u8);
    expect(expected).toBe(actual);
  }

  if (hasBlob) {
    const blob = await c.toBlob({
      value: binaryString,
      encoding: "BinaryString",
    });
    const actual = await c.toText(blob);
    expect(expected).toBe(actual);
  }

  if (hasBuffer) {
    const buf = await c.toBuffer({
      value: binaryString,
      encoding: "BinaryString",
    });
    const actual = await c.toText(buf);
    expect(expected).toBe(actual);
  }

  {
    const base64 = await c.toBase64({
      value: binaryString,
      encoding: "BinaryString",
    });
    const actual = await c.toText({ value: base64, encoding: "Base64" });
    expect(expected).toBe(actual);
  }
});
