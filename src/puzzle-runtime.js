import { PuzzleGame } from "./puzzle-core.js";
import { PuzzleRenderer } from "./puzzle-renderer.js";
import { AssetBank } from "./skeletal-assets.js";

export const SAVE_KEY = "xiaozhen-biehuang-puzzle-v1";
export function startPuzzle(platform) {
  const game = new PuzzleGame();
  const assets = new AssetBank(platform, "assets/generated");
  const renderer = new PuzzleRenderer(platform.context, assets);
  const saved = platform.load(SAVE_KEY);
  if (saved) game.restore(saved);
  void assets.preload();
  const announce = () => platform.announce?.(game.state);
  const save = () => { platform.save(SAVE_KEY, game.serialize()); announce(); };
  platform.setPointerHandler(({ x, y }) => { if (game.handleTap(x, y)) save(); });
  platform.setKeyHandler(({ key, originalEvent }) => {
    if ([" ", "p", "escape"].includes(key)) {
      originalEvent.preventDefault();
      if (game.state.phase === "levels") game.state.phase = game.state.previousPhase;
      else game.togglePause();
    } else if (key === "r") game.startLevel(game.state.level);
    else if (key === "enter" && ["paused", "victory", "defeat"].includes(game.state.phase)) {
      game.handleTap(640, 465);
    } else return;
    save();
  });
  platform.setVisibilityHandler(() => { game.pauseForVisibility(); save(); });
  let previous = platform.now();
  function frame(timestamp) {
    const dt = Math.min(0.1, Math.max(0, (timestamp - previous) / 1000));
    previous = timestamp;
    game.update(dt);
    renderer.draw(game.state, dt);
    platform.requestFrame(frame);
  }
  announce(); renderer.draw(game.state, 0); platform.requestFrame(frame);
  return { game, assets, renderer };
}
