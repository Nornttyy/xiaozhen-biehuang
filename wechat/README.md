# 微信小游戏试玩入口

先在上一级目录运行：

```bash
node scripts/build-wechat.mjs
```

然后用微信开发者工具导入本目录。`touristappid` 仅用于本地试玩，发布前替换为实际小游戏 AppID。

入口使用 `wx.createCanvas`、触摸事件、图片预载和同步本地存储；战斗核心与浏览器版本共用。构建会复制战场背景与 24 个独立骨骼部件，不会复制角色源图集。
