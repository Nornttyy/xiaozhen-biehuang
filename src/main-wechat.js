import { TowerDefenseGame, LOGICAL_HEIGHT, LOGICAL_WIDTH } from "./core.js";
import { WechatPlatform } from "./platform-wechat.js";
import { CanvasRenderer } from "./renderer.js";
import { AssetBank } from "./skeletal-assets.js";

const SAVE_KEY = "xiaozhen-biehuang-turn-defense-v3";
const FIXED_STEP = 1 / 60;

const canvas = wx.createCanvas();
const platform = new WechatPlatform(canvas, LOGICAL_WIDTH, LOGICAL_HEIGHT);
const game = new TowerDefenseGame();
const assets = new AssetBank(platform, "assets/generated");
const renderer = new CanvasRenderer(platform.context, assets);
void assets.preload();

const saved = platform.load(SAVE_KEY);
if (saved) game.restore(saved);

function save() {
  if (platform.save(SAVE_KEY, game.serialize())) game.flashSaved();
}

function handleAction(action) {
  if (!action) return;
  if (action.type === "save") save();
  if (action.type === "restart") {
    platform.remove(SAVE_KEY);
    save();
  }
}

platform.setPointerHandler(({ x, y }) => handleAction(game.handleTap(x, y)));
platform.setVisibilityHandler(() => {
  game.pauseForVisibility();
  save();
});

let previous = platform.now();
let accumulator = 0;
let autosaveClock = 0;

function frame(timestamp) {
  const frameDelta = Math.min(0.1, Math.max(0, (timestamp - previous) / 1000));
  previous = timestamp;
  accumulator += frameDelta;

  while (accumulator >= FIXED_STEP) {
    game.update(FIXED_STEP);
    accumulator -= FIXED_STEP;
    autosaveClock += FIXED_STEP;
    if (autosaveClock >= 10) {
      autosaveClock = 0;
      platform.save(SAVE_KEY, game.serialize());
    }
  }

  renderer.draw(game.state, frameDelta);
  platform.requestFrame(frame);
}

renderer.draw(game.state, 0);
platform.requestFrame(frame);
