import {
  createReadStream,
  createWriteStream,
  rmSync,
  statSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { DEFAULT_CONVERTER as c } from "../converver";

it("readable to buffer", async () => {
  const imagePath = join(process.cwd(), "sample.jpg");
  const srcStats = statSync(imagePath);
  const readable = createReadStream(imagePath);
  const buffer = await c.convert(readable, "buffer");
  const outPath = join(tmpdir(), `univ-fs-${Date.now()}.jpg`);
  writeFileSync(outPath, buffer);
  const dstStats = statSync(outPath);
  rmSync(outPath);
  expect(dstStats.size).toBe(srcStats.size);
});

it("readable to uint8array", async () => {
  const imagePath = join(process.cwd(), "sample.jpg");
  const srcStats = statSync(imagePath);
  const readable = createReadStream(imagePath);
  const buffer = await c.convert(readable, "uint8array");
  const outPath = join(tmpdir(), `univ-fs-${Date.now()}.jpg`);
  writeFileSync(outPath, buffer);
  const dstStats = statSync(outPath);
  rmSync(outPath);
  expect(dstStats.size).toBe(srcStats.size);
});

it("pipe readable", async () => {
  const imagePath = join(process.cwd(), "sample.jpg");
  const srcStats = statSync(imagePath);
  const readable = createReadStream(imagePath);
  const outPath = join(tmpdir(), `univ-fs-${Date.now()}.jpg`);
  const writable = createWriteStream(outPath);
  await c.pipe(readable, writable);
  const dstStats = statSync(outPath);
  rmSync(outPath);
  expect(dstStats.size).toBe(srcStats.size);
});
