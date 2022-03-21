import {
  hasBlob,
  hasBuffer,
  hasReadable,
  hasReadableStream,
} from "../converters";
import { conv as c } from "../converver";

const head = "大谷翔平";
const tail = "ホームラン";
const expected = "大谷翔平ホームラン";

it("ArrayBuffer", async () => {
  const chunk1 = await c.toArrayBuffer(head);
  const chunk2 = await c.toArrayBuffer(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text");
  expect(expected).toBe(merged);
});

it("Utin8Array", async () => {
  const chunk1 = await c.toUint8Array(head);
  const chunk2 = await c.toUint8Array(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text");
  expect(expected).toBe(merged);
});

it("Buffer", async () => {
  if (!hasBuffer) {
    return;
  }

  const chunk1 = await c.toBuffer(head);
  const chunk2 = await c.toBuffer(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text");
  expect(expected).toBe(merged);
});

it("Blob", async () => {
  if (!hasBlob) {
    return;
  }

  const chunk1 = await c.toBlob(head);
  const chunk2 = await c.toBlob(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text");
  expect(expected).toBe(merged);
});

it("Base64", async () => {
  const chunk1 = await c.toBase64(head);
  const chunk2 = await c.toBase64(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text");
  expect(expected).toBe(merged);
});

it("BinaryString", async () => {
  const chunk1 = await c.toBinary(head);
  const chunk2 = await c.toBinary(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text");
  expect(expected).toBe(merged);
});

it("Readable", async () => {
  if (!hasReadable) {
    return;
  }

  const chunk1 = await c.toReadable(head);
  const chunk2 = await c.toReadable(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text");
  expect(expected).toBe(merged);
});

it("ReadableStream", async () => {
  if (!hasReadableStream) {
    return;
  }

  const chunk1 = await c.toReadableStream(head);
  const chunk2 = await c.toReadableStream(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text");
  expect(expected).toBe(merged);
});
