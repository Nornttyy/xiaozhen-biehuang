import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "./puzzle-core.js";
import { WechatPlatform } from "./platform-wechat.js";
import { startPuzzle } from "./puzzle-runtime.js";

const platform = new WechatPlatform(wx.createCanvas(), LOGICAL_WIDTH, LOGICAL_HEIGHT);
startPuzzle(platform);
