/**
 * Platform boundary used by the prototype.
 * A WeChat adapter only needs to provide the same surface with wx.createCanvas,
 * wx.requestAnimationFrame, wx.onTouchStart and wx.setStorageSync/getStorageSync.
 * The simulation and renderer import no browser or WeChat globals.
 */
export class BrowserPlatform {
  constructor(canvas, logicalWidth, logicalHeight) {
    this.canvas = canvas;
    this.logicalWidth = logicalWidth;
    this.logicalHeight = logicalHeight;
    this.context = canvas.getContext("2d", { alpha: false });
    this.pointerHandler = null;
    this.keyHandler = null;
    this.visibilityHandler = null;
    this.handleResize = this.resize.bind(this);
    this.handlePointer = this.onPointer.bind(this);
    this.handleKey = this.onKey.bind(this);
    this.handleVisibility = this.onVisibility.bind(this);

    window.addEventListener("resize", this.handleResize, { passive: true });
    canvas.addEventListener("pointerdown", this.handlePointer, { passive: false });
    window.addEventListener("keydown", this.handleKey);
    document.addEventListener("visibilitychange", this.handleVisibility);
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    this.resize();
  }

  resize() {
    const stage = this.canvas.parentElement;
    let availableWidth = Math.max(1, window.innerWidth - 24);
    let availableHeight = Math.max(1, window.innerHeight - 24);
    if (stage && typeof getComputedStyle === "function") {
      const style = getComputedStyle(stage);
      const horizontalPadding = Number.parseFloat(style.paddingLeft || 0) + Number.parseFloat(style.paddingRight || 0);
      const verticalPadding = Number.parseFloat(style.paddingTop || 0) + Number.parseFloat(style.paddingBottom || 0);
      availableWidth = Math.max(1, stage.clientWidth - horizontalPadding);
      availableHeight = Math.max(1, stage.clientHeight - verticalPadding);
    }
    const cssScale = Math.min(availableWidth / this.logicalWidth, availableHeight / this.logicalHeight);
    const cssWidth = Math.floor(this.logicalWidth * cssScale);
    const cssHeight = Math.floor(this.logicalHeight * cssScale);
    const renderScale = Math.max(0.75, Math.min(cssScale * (window.devicePixelRatio || 1), 2));

    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.canvas.width = Math.round(this.logicalWidth * renderScale);
    this.canvas.height = Math.round(this.logicalHeight * renderScale);
    this.context.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    this.context.imageSmoothingEnabled = true;
  }

  onPointer(event) {
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.logicalWidth;
    const y = ((event.clientY - rect.top) / rect.height) * this.logicalHeight;
    this.pointerHandler?.({ x, y, pointerType: event.pointerType || "mouse" });
  }

  onKey(event) {
    this.keyHandler?.({ key: event.key.toLowerCase(), originalEvent: event });
  }

  onVisibility() {
    if (document.hidden) this.visibilityHandler?.();
  }

  setPointerHandler(handler) {
    this.pointerHandler = handler;
  }

  setKeyHandler(handler) {
    this.keyHandler = handler;
  }

  setVisibilityHandler(handler) {
    this.visibilityHandler = handler;
  }

  announce(state) {
    const phase = { playing: "进行中", paused: "已暂停", levels: "选择关卡", victory: "已通关", defeat: "再试一次" }[state.phase];
    const text = `${phase}。第 ${state.level} 关，剩余 ${state.moves} 步，生命 ${state.hp}，已击败 ${state.foeIndex} / 3。点击两块以上相邻同色方块。`;
    this.canvas.setAttribute?.("aria-label", text);
    const status = document.querySelector("#game-status");
    if (status) status.textContent = text;
  }

  now() {
    return performance.now();
  }

  requestFrame(callback) {
    return window.requestAnimationFrame(callback);
  }

  createImage() {
    const ImageConstructor = globalThis.Image || window.Image;
    if (typeof ImageConstructor === "function") return new ImageConstructor();
    if (typeof document.createElement === "function") return document.createElement("img");
    return null;
  }

  loadImage(source) {
    const image = this.createImage();
    if (!image) return Promise.resolve(null);
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        image.onload = null;
        image.onerror = null;
        resolve(value);
      };
      image.onload = () => finish(image);
      image.onerror = () => finish(null);
      image.src = source;
      if (image.complete && (image.naturalWidth || image.width)) finish(image);
    });
  }

  load(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  save(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  remove(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
}
