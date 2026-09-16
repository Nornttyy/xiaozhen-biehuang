import test from "node:test";
import assert from "node:assert/strict";

test("WeChat bundle creates a landscape canvas and installs touch input", async () => {
  const storage = new Map();
  const gradient = { addColorStop() {} };
  const context = new Proxy({
    createLinearGradient: () => gradient,
  }, {
    get(target, property) {
      if (property in target) return target[property];
      return () => {};
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  });
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
    requestAnimationFrame: () => 1,
  };
  let touchListener = null;

  globalThis.wx = {
    createCanvas: () => canvas,
    getWindowInfo: () => ({ windowWidth: 1280, windowHeight: 720, pixelRatio: 1 }),
    onTouchStart: (listener) => { touchListener = listener; },
    onHide() {},
    onWindowResize() {},
    getStorageSync: (key) => storage.get(key) || "",
    setStorageSync: (key, value) => storage.set(key, value),
    removeStorageSync: (key) => storage.delete(key),
  };

  await import(`../wechat/game.js?smoke=${Date.now()}`);
  assert.equal(canvas.width, 1280);
  assert.equal(canvas.height, 720);
  assert.equal(typeof touchListener, "function");

  delete globalThis.wx;
});

