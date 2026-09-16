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

  now() {
    return performance.now();
  }

  requestFrame(callback) {
    return window.requestAnimationFrame(callback);
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
