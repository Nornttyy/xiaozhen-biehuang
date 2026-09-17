import { CafeRig, RIG_ACTIONS, EXPRESSION_OPTIONS, loadRigImages } from './cafe-rig.js';

const canvas = document.querySelector('#rig-canvas');
const context = canvas.getContext('2d');
const controls = document.querySelector('#preview-controls');
const overlay = document.querySelector('#load-overlay');
const loadStatus = document.querySelector('#load-status');
const retry = document.querySelector('#retry-load');
const liveStatus = document.querySelector('#preview-status');
const pauseButton = document.querySelector('#pause-button');
const bonesButton = document.querySelector('#bones-button');
const explodeButton = document.querySelector('#explode-button');
const speedSlider = document.querySelector('#speed-slider');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const state = {
  action: 'idle', expression: 'happy', paused: motionPreference.matches,
  debug: false, exploded: false, speed: 1, time: 0, ready: false,
};
let rig = null;
let frameId = 0;
let lastTimestamp = null;
let width = 0;
let height = 0;
let pixelRatio = 1;
let loadAttempt = 0;
let lastPose = null;
let disposed = false;
const listeners = new AbortController();

function listen(element, event, handler) {
  element.addEventListener(event, handler, { signal: listeners.signal });
}

function makeChoices(containerId, options, key) {
  const container = document.querySelector(containerId);
  for (const option of options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.value = option.id;
    button.textContent = option.label;
    button.setAttribute('aria-pressed', String(state[key] === option.id));
    listen(button, 'click', () => setChoice(key, option.id));
    container.append(button);
  }
}

function syncControls() {
  for (const [container, key] of [['#action-options', 'action'], ['#expression-options', 'expression']]) {
    document.querySelectorAll(`${container} button`).forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.value === state[key]));
    });
  }
  pauseButton.setAttribute('aria-pressed', String(state.paused));
  pauseButton.setAttribute('aria-label', state.paused ? '播放动画' : '暂停动画');
  document.querySelector('#pause-label').textContent = state.paused ? '播放' : '暂停';
  document.querySelector('#pause-icon').textContent = state.paused ? '▶' : 'Ⅱ';
  bonesButton.setAttribute('aria-pressed', String(state.debug));
  explodeButton.setAttribute('aria-pressed', String(state.exploded));
  const action = RIG_ACTIONS.find((option) => option.id === state.action)?.label ?? state.action;
  const expression = EXPRESSION_OPTIONS.find((option) => option.id === state.expression)?.label ?? state.expression;
  document.querySelector('#pose-caption').textContent = `${action} · ${expression}`;
  speedSlider.value = String(state.speed);
  speedSlider.setAttribute('aria-valuetext', `${state.speed} 倍速`);
  document.querySelector('#speed-value').value = `${state.speed}×`;
}

function setChoice(key, value) {
  const options = key === 'action' ? RIG_ACTIONS : EXPRESSION_OPTIONS;
  if (!options.some((option) => option.id === value)) return false;
  state[key] = value;
  if (key === 'action') state.time = 0;
  syncControls();
  draw();
  return true;
}

function stopAnimation() {
  cancelAnimationFrame(frameId);
  frameId = 0;
  lastTimestamp = null;
}

function startAnimation() {
  if (disposed || frameId || !state.ready || state.paused || document.hidden) return;
  frameId = requestAnimationFrame(animate);
}

function setPaused(value) {
  state.paused = Boolean(value);
  stopAnimation();
  syncControls();
  draw();
  startAnimation();
}

function setDebug(value) {
  state.debug = Boolean(value);
  syncControls();
  draw();
}

function setExploded(value) {
  state.exploded = Boolean(value);
  syncControls();
  draw();
}

function setSpeed(value) {
  const speed = Number(value);
  if (!Number.isFinite(speed)) return false;
  state.speed = Math.round(Math.min(1.5, Math.max(0.5, speed)) * 10) / 10;
  syncControls();
  return true;
}

function shape(x, y, w, h, radius, fill, stroke) {
  context.beginPath();
  context.roundRect(x, y, w, h, radius);
  context.fillStyle = fill;
  context.fill();
  if (stroke) { context.strokeStyle = stroke; context.lineWidth = 2; context.stroke(); }
}

function backdrop() {
  context.fillStyle = '#f4e8d7';
  context.fillRect(0, 0, width, height);
  const floor = height * 0.81;
  context.fillStyle = '#e8d4be';
  context.fillRect(0, floor, width, height - floor);
  context.fillStyle = '#dfc6af';
  context.fillRect(0, floor, width, 3);

  // Flat awning, window and counter keep the character in a quiet cafe setting.
  const awningHeight = Math.min(42, height * 0.1);
  context.fillStyle = '#cfaaa0';
  context.fillRect(0, 0, width, awningHeight);
  const stripe = width / 17;
  for (let i = 0; i < 17; i += 1) {
    const color = i % 2 === 0 ? '#e7c0b4' : '#fff0dd';
    shape(i * stripe - 0.5, -10, stripe + 1, awningHeight + 18, [0, 0, stripe * 0.45, stripe * 0.45], color);
  }

  const wx = width * 0.075;
  const wy = height * 0.2;
  const ww = width * 0.25;
  const wh = height * 0.35;
  shape(wx, wy, ww, wh, Math.min(ww * 0.48, 52), '#d5ddc5', '#d6bba1');
  context.save();
  context.beginPath();
  context.roundRect(wx + 3, wy + 3, ww - 6, wh - 6, Math.min(ww * 0.48, 50));
  context.clip();
  context.fillStyle = '#e6ead7';
  context.fillRect(wx, wy, ww, wh * 0.54);
  context.fillStyle = '#bbccaf';
  context.beginPath();
  context.ellipse(wx + ww * 0.22, wy + wh, ww * 0.58, wh * 0.43, 0, 0, Math.PI * 2);
  context.ellipse(wx + ww * 0.95, wy + wh, ww * 0.56, wh * 0.65, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
  context.fillStyle = '#d5b89e';
  context.fillRect(wx + ww * 0.49, wy + 2, Math.max(3, width * 0.005), wh - 3);
  shape(wx - 7, wy + wh - 4, ww + 14, 9, 3, '#c4a487');

  const cx = width * 0.79;
  const cy = height * 0.57;
  shape(cx, cy, width * 0.24, floor - cy, 5, '#d4af94');
  shape(cx - 9, cy - 5, width * 0.25 + 9, 10, 3, '#b28f78');
  const cup = Math.min(21, width * 0.028);
  shape(cx + width * 0.045, cy - cup * 1.05, cup, cup * 0.85, [2, 2, 6, 6], '#fff3df');
  context.strokeStyle = '#fff3df';
  context.lineWidth = 3;
  context.beginPath();
  context.arc(cx + width * 0.045 + cup, cy - cup * 0.65, cup * 0.25, -Math.PI / 2, Math.PI / 2);
  context.stroke();
  shape(cx + width * 0.11, cy - cup * 1.55, cup * 1.1, cup * 1.4, 3, '#b5bf9c');
  context.fillStyle = '#8b9f7b';
  context.beginPath();
  context.ellipse(cx + width * 0.126, cy - cup * 1.75, cup * 0.2, cup * 0.75, -0.55, 0, Math.PI * 2);
  context.ellipse(cx + width * 0.134, cy - cup * 1.9, cup * 0.22, cup * 0.8, 0.45, 0, Math.PI * 2);
  context.fill();
}

function draw() {
  if (disposed || !context || !width || !height) return;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  backdrop();
  if (!rig || !state.ready) return;
  const scale = Math.min(height * 0.79 / (state.exploded ? 455 : 365), width * 0.8 / (state.exploded ? 550 : 350));
  const floorY = height * 0.9;
  context.fillStyle = '#d6bca6';
  context.beginPath();
  context.ellipse(width * 0.51, floorY, 82 * scale, 10 * scale, 0, 0, Math.PI * 2);
  context.fill();
  context.save();
  lastPose = rig.draw(context, {
    time: state.time, action: state.action, expression: state.expression,
    x: width * 0.51, y: floorY - (state.exploded ? 238 : 301) * scale, scale,
    debug: state.debug, explode: state.exploded ? 1 : 0,
  });
  context.restore();
}

function resize() {
  if (disposed) return;
  const bounds = canvas.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
  const nextWidth = Math.max(1, Math.round(width * pixelRatio));
  const nextHeight = Math.max(1, Math.round(height * pixelRatio));
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }
  draw();
}

function animate(timestamp) {
  frameId = 0;
  if (disposed || state.paused || document.hidden || !state.ready) return;
  if (lastTimestamp !== null) state.time += Math.min((timestamp - lastTimestamp) / 1000, 0.05) * state.speed;
  lastTimestamp = timestamp;
  if (pixelRatio !== Math.min(window.devicePixelRatio || 1, 3)) resize();
  else draw();
  startAnimation();
}

async function load() {
  const attempt = ++loadAttempt;
  stopAnimation();
  state.ready = false;
  controls.disabled = true;
  overlay.hidden = false;
  retry.hidden = true;
  loadStatus.textContent = '珊瑚准备中…';
  try {
    if (!context) throw new Error('Canvas is unavailable');
    const images = await loadRigImages();
    if (disposed || attempt !== loadAttempt) return;
    rig = new CafeRig(images);
    state.ready = true;
    resize();
    overlay.hidden = true;
    controls.disabled = false;
    liveStatus.textContent = '角色已就绪。';
    startAnimation();
  } catch (error) {
    if (disposed || attempt !== loadAttempt) return;
    state.ready = false;
    rig = null;
    loadStatus.textContent = '角色没能加载，请重试。';
    retry.hidden = false;
    console.error('Cafe character preview could not load:', error);
  }
}

makeChoices('#action-options', RIG_ACTIONS, 'action');
makeChoices('#expression-options', EXPRESSION_OPTIONS, 'expression');
listen(pauseButton, 'click', () => setPaused(!state.paused));
listen(bonesButton, 'click', () => setDebug(!state.debug));
listen(explodeButton, 'click', () => setExploded(!state.exploded));
listen(speedSlider, 'input', () => setSpeed(speedSlider.value));
listen(retry, 'click', load);
listen(window, 'resize', resize);
listen(document, 'visibilitychange', () => {
  stopAnimation();
  if (!document.hidden) { resize(); startAnimation(); }
});
listen(motionPreference, 'change', (event) => { if (event.matches) setPaused(true); });
const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(canvas);
syncControls();
resize();

export const rigPreview = Object.freeze({
  canvas,
  getState: () => ({ ...state, width, height, pixelRatio, hidden: document.hidden }),
  getPose: () => lastPose,
  setAction: (action) => setChoice('action', action),
  setExpression: (expression) => setChoice('expression', expression),
  setPaused, setDebug, setExploded, setSpeed, resize, drawOnce: draw, reload: load,
  dispose() {
    disposed = true;
    loadAttempt += 1;
    stopAnimation();
    resizeObserver.disconnect();
    listeners.abort();
  },
});

window.__cafeRigPreview = rigPreview;
export const ready = load();
