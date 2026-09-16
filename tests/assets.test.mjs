import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AssetBank, RANGER_PARTS, SLIME_PARTS } from "../src/skeletal-assets.js";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("asset bank loads one background and 24 independent skeletal parts", async () => {
  const requested = [];
  const platform = {
    async loadImage(source) {
      requested.push(source);
      return { source };
    },
  };
  const assets = new AssetBank(platform, "assets/generated/");
  await assets.preload();

  assert.equal(requested.length, 25);
  assert.equal(new Set(requested).size, 25);
  assert.equal(RANGER_PARTS.length, 16);
  assert.equal(SLIME_PARTS.length, 8);
  assert.equal(assets.groupReady("ranger"), true);
  assert.equal(assets.groupReady("slime"), true);
  assert.ok(requested.every((source) => !source.includes("atlas")));
});

test("browser and WeChat packs contain the same production PNGs without atlases", async () => {
  const relativePaths = [
    "battlefield-anime-v2.png",
    ...RANGER_PARTS.map((part) => `ranger/parts/${part}.png`),
    ...SLIME_PARTS.map((part) => `slime/parts/${part}.png`),
  ];

  for (const relativePath of relativePaths) {
    const browserPath = path.join(projectDir, "assets/generated", relativePath);
    const wechatPath = path.join(projectDir, "wechat/assets/generated", relativePath);
    assert.ok((await stat(browserPath)).size > 0, relativePath);
    assert.deepEqual(await readFile(wechatPath), await readFile(browserPath), relativePath);
  }
});
