import test from "node:test";
import assert from "node:assert/strict";

test("browser entry renders its first frame against the platform contract", async () => {
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
    style: {},
    getContext: () => context,
    addEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
  };

  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    addEventListener() {},
    requestAnimationFrame: () => 1,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
  };
  globalThis.document = {
    hidden: false,
    querySelector: (selector) => selector === "#game" ? canvas : null,
    addEventListener() {},
  };

  const { runtime } = await import(`../src/main.js?smoke=${Date.now()}`);
  assert.ok(canvas.width > 0);
  assert.ok(canvas.height > 0);
  assert.ok(Math.abs(canvas.width / canvas.height - 16 / 9) < 0.002);
  assert.equal(runtime.game.state.mode, "puzzle");
  assert.equal(runtime.game.state.board.length, 42);

  delete globalThis.window;
  delete globalThis.document;
});
