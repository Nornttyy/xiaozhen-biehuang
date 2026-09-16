/**
 * WeChat Mini Game implementation of the same small platform surface used by
 * BrowserPlatform. Battle rules and rendering stay platform agnostic.
 */
export class WechatPlatform {
  constructor(canvas, logicalWidth, logicalHeight) {
    this.canvas = canvas;
    this.logicalWidth = logicalWidth;
    this.logicalHeight = logicalHeight;
    this.context = canvas.getContext("2d", { alpha: false });
    this.pointerHandler = null;
    this.visibilityHandler = null;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this.handleTouch = this.onTouch.bind(this);
    this.handleHide = this.onHide.bind(this);
    this.handleResize = this.resize.bind(this);

    wx.onTouchStart(this.handleTouch);
    wx.onHide(this.handleHide);
    if (typeof wx.onWindowResize === "function") wx.onWindowResize(this.handleResize);
    this.resize();
  }

  getWindowInfo() {
    if (typeof wx.getWindowInfo === "function") return wx.getWindowInfo();
    return wx.getSystemInfoSync();
  }

  resize() {
    const info = this.getWindowInfo();
    const windowWidth = Math.max(1, info.windowWidth || info.screenWidth || this.logicalWidth);
    const windowHeight = Math.max(1, info.windowHeight || info.screenHeight || this.logicalHeight);
    const dpr = Math.min(info.pixelRatio || info.devicePixelRatio || 1, 2);

    this.scale = Math.min(windowWidth / this.logicalWidth, windowHeight / this.logicalHeight);
    this.offsetX = (windowWidth - this.logicalWidth * this.scale) / 2;
    this.offsetY = (windowHeight - this.logicalHeight * this.scale) / 2;

    this.canvas.width = Math.round(windowWidth * dpr);
    this.canvas.height = Math.round(windowHeight * dpr);
    this.context.setTransform(
      dpr * this.scale,
      0,
      0,
      dpr * this.scale,
      dpr * this.offsetX,
      dpr * this.offsetY,
    );
    this.context.imageSmoothingEnabled = true;
  }

  onTouch(event) {
    const touch = event.changedTouches?.[0] || event.touches?.[0];
    if (!touch) return;
    const x = (touch.clientX - this.offsetX) / this.scale;
    const y = (touch.clientY - this.offsetY) / this.scale;
    this.pointerHandler?.({ x, y, pointerType: "touch" });
  }

  onHide() {
    this.visibilityHandler?.();
  }

  setPointerHandler(handler) {
    this.pointerHandler = handler;
  }

  setKeyHandler() {}

  setVisibilityHandler(handler) {
    this.visibilityHandler = handler;
  }

  now() {
    return Date.now();
  }

  requestFrame(callback) {
    const wrapped = (timestamp) => callback(Number.isFinite(timestamp) ? timestamp : this.now());
    if (typeof this.canvas.requestAnimationFrame === "function") {
      return this.canvas.requestAnimationFrame(wrapped);
    }
    if (typeof requestAnimationFrame === "function") return requestAnimationFrame(wrapped);
    return setTimeout(() => wrapped(this.now()), 16);
  }

  createImage() {
    if (typeof this.canvas.createImage === "function") return this.canvas.createImage();
    if (typeof wx.createImage === "function") return wx.createImage();
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
    });
  }

  load(key) {
    try {
      return wx.getStorageSync(key) || null;
    } catch {
      return null;
    }
  }

  save(key, value) {
    try {
      wx.setStorageSync(key, value);
      return true;
    } catch {
      return false;
    }
  }

  remove(key) {
    try {
      wx.removeStorageSync(key);
      return true;
    } catch {
      return false;
    }
  }
}
