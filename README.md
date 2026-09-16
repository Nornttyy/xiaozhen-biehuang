# 《小镇别慌》横屏五路塔防原型

横屏、纯 Canvas 2D 的玩法验证版。左侧为小镇城门，右侧为魔物入口，中间是五条清晰防线。当前所有角色与魔物都是几何占位绘制，不依赖概念生成图，后续可以替换渲染层而不改战斗核心。

在线试玩：<https://nornttyy.github.io/xiaozhen-biehuang/>

## 运行

```bash
python3 -m http.server 8080
```

浏览器打开 `http://localhost:8080`。

## 操作

- 点角色卡，再点左侧高亮格部署。
- 点火、冰、雷、自然能量卡，再点己方角色；每名角色最多 2 枚能量。
- 两枚能量会自动进化，组合与放入顺序无关。
- 点右上角播放图标进入 6 波战斗；清完本波后有 3.5 秒补阵时间，倒计时归零后魔物会逐步狂暴。
- 城门有 10 点耐久；初始补给 20，每 3 秒自然恢复 1 点，击杀魔物也会补充。快捷键：`Enter` 开始、`Space/P` 暂停、`S` 存档、`R` 重开。

## 结构

- `src/core.js`：平台无关的战斗、卡牌、进化、波次和序列化。
- `src/renderer.js`：1280×720 Canvas 2D 占位渲染。
- `src/platform-browser.js`：浏览器输入、帧循环接口和 LocalStorage。
- `src/platform-wechat.js`：微信小游戏 Canvas、触摸、窗口与存储适配。
- `src/main.js`：固定时间步长与模块组装。
- `wechat/`：可直接导入微信开发者工具的横屏试玩入口。

微信小游戏适配时，实现与 `BrowserPlatform` 相同的画布、时钟、触摸、存储和前后台接口即可。核心文件不读取 `window`、DOM 或 `wx`。

生成微信小游戏单文件入口：

```bash
npm run build:wechat
```

## 测试

```bash
npm test
```
