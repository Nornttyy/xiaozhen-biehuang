import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "./puzzle-core.js";
import { BrowserPlatform } from "./platform-browser.js";
import { startPuzzle } from "./puzzle-runtime.js";

const canvas = document.querySelector("#game");
const platform = new BrowserPlatform(canvas, LOGICAL_WIDTH, LOGICAL_HEIGHT);
export const runtime = startPuzzle(platform);
