import { GRID, COLORS, BUTTONS, LEVEL_COUNT, possibleMoves, tileCenter, levelRect } from "./puzzle-core.js";
import { CanvasRenderer } from "./renderer.js";

const TAU = Math.PI * 2;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const INK = "#574368", MUTED = "#9b8ca7";
function round(ctx, x, y, w, h, r = 20) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function panel(ctx, x, y, w, h, fill = "#fffafd", stroke = "#e8dcec", r = 22) {
  round(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}
function label(ctx, str, x, y, size = 18, color = INK, align = "left", weight = 700) {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(String(str), x, y);
}
function star(ctx, x, y, radius, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? radius * 0.46 : radius;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function symbol(ctx, type, x, y, size, color = "#fffdfc") {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40);
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 3.8; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  if (type === 0) {
    ctx.moveTo(1, -20); ctx.bezierCurveTo(18, -5, 3, -3, 15, -11); ctx.bezierCurveTo(28, 10, 8, 24, -7, 17);
    ctx.bezierCurveTo(-23, 10, -16, -3, -11, -9); ctx.bezierCurveTo(-11, 5, 5, -1, 1, -20); ctx.fill();
    ctx.fillStyle = "rgba(255,209,119,.75)"; ctx.beginPath(); ctx.moveTo(1, -2); ctx.quadraticCurveTo(13, 11, 0, 15); ctx.quadraticCurveTo(-10, 10, 1, -2); ctx.fill();
  } else if (type === 1) {
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -18); ctx.moveTo(-5, -13); ctx.lineTo(0, -8); ctx.lineTo(5, -13); ctx.stroke(); ctx.restore(); }
  } else if (type === 2) {
    ctx.moveTo(4, -20); ctx.lineTo(-15, 3); ctx.lineTo(-2, 3); ctx.lineTo(-6, 21); ctx.lineTo(16, -4); ctx.lineTo(3, -4); ctx.closePath(); ctx.fill();
  } else if (type === 3) {
    ctx.moveTo(15, -19); ctx.bezierCurveTo(-17, -20, -24, 9, -4, 14); ctx.bezierCurveTo(16, 20, 20, -6, 15, -19); ctx.fill();
    ctx.strokeStyle = "#70b99c"; ctx.lineWidth = 2.3; ctx.beginPath(); ctx.moveTo(-10, 18); ctx.quadraticCurveTo(-1, 5, 11, -11); ctx.stroke();
  } else {
    ctx.moveTo(0, 18); ctx.bezierCurveTo(-31, -1, -19, -24, 0, -10); ctx.bezierCurveTo(19, -24, 31, -1, 0, 18); ctx.fill();
  }
  ctx.restore();
}
function button(ctx, rect, text, fill = "#fffafd", color = INK) {
  panel(ctx, rect.x, rect.y + 3, rect.w, rect.h, "#d9cbe2", null, 17);
  panel(ctx, rect.x, rect.y, rect.w, rect.h, fill, "#e0d3e8", 17);
  label(ctx, text, rect.x + rect.w / 2, rect.y + rect.h / 2, 18, color, "center");
}

export class PuzzleRenderer extends CanvasRenderer {
  // Battle health is shown once in the new puzzle HUD.
  drawHealth() {}
  drawElements() {}
  draw(state, dt = 0) {
    if (!["paused", "levels"].includes(state.phase)) this.time += dt;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 1280, 720);
    this.backdrop();
    this.header(state);
    this.battle(state);
    this.team(state);
    this.board(state);
    this.effects(state);
    this.footer(state);
    this.overlay(state);
  }
  backdrop() {
    const ctx = this.ctx;
    ctx.fillStyle = "#f4eff9"; ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = "#ffe5e6"; ctx.beginPath(); ctx.ellipse(85, 200, 270, 400, -0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = "#e5eafa"; ctx.beginPath(); ctx.ellipse(1250, 625, 260, 370, 0.3, 0, TAU); ctx.fill();
    for (let i = 0; i < 28; i++) {
      const x = (i * 173 + 32) % 1280, y = (i * 97 + 17) % 720;
      star(ctx, x, y, 3 + i % 3, i % 2 ? "#e3d6ed" : "#f2cdd9");
    }
    ctx.strokeStyle = "#ded0e8"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(32, 100); ctx.lineTo(1248, 100); ctx.stroke();
  }
  header(s) {
    const ctx = this.ctx;
    star(ctx, 57, 54, 23, "#f4ab7f"); star(ctx, 57, 54, 13, "#fff3d1");
    label(ctx, "小镇别慌", 92, 49, 31, INK, "left", 900);
    label(ctx, "美少女消消乐", 94, 77, 13, MUTED, "left", 600);
    panel(ctx, 318, 35, 202, 46, "#fffafd", "#eadce9", 23);
    symbol(ctx, 4, 345, 57, 20, "#ef8db1");
    panel(ctx, 367, 50, 92, 13, "#f6e4ec", null, 6);
    if (s.hp) panel(ctx, 367, 50, 92 * s.hp / 100, 13, "#ef96b4", null, 6);
    label(ctx, s.hp, 484, 57, 18, "#c27497", "center");
    button(ctx, BUTTONS.levels, `第 ${String(s.level).padStart(2, "0")} 关`);
    panel(ctx, 918, 32, 169, 52, "#fff8e9", "#eddcc3", 18);
    label(ctx, "剩余步数", 937, 58, 14, "#a89167");
    label(ctx, s.moves, 1058, 58, 28, s.moves <= 5 ? "#d66b87" : "#9d7850", "center", 900);
    button(ctx, BUTTONS.pause, s.phase === "paused" ? "▶" : "Ⅱ");
    button(ctx, BUTTONS.restart, "↻");
  }
  battle(s) {
    const ctx = this.ctx, box = { x: 34, y: 119, w: 539, h: 329 };
    panel(ctx, box.x, box.y + 5, box.w, box.h, "#dfd0e7", null, 26);
    ctx.save(); round(ctx, box.x, box.y, box.w, box.h, 26); ctx.clip();
    const bg = this.assets?.get("background");
    if (bg) ctx.drawImage(bg, 0, 0, bg.width, bg.height * 0.7, box.x, box.y, box.w, box.h);
    else { ctx.fillStyle = "#d7eadc"; ctx.fillRect(box.x, box.y, box.w, box.h); }
    ctx.fillStyle = "rgba(255,247,239,.33)"; ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = "rgba(241,233,209,.55)"; ctx.beginPath(); ctx.ellipse(295, 365, 275, 44, 0, 0, TAU); ctx.fill();
    const a = s.animation, age = a?.age ?? 99, attack = a?.damage > 0 && age < 0.36;
    const hero = { id: "u1", radius: 45, hp: s.hp, maxHp: 100, action: attack ? "attack" : a?.enemyDamage && age > 0.42 && age < 0.6 ? "hit" : null,
      actionTtl: attack ? (1 - age / 0.36) * 0.32 : 0.1, formColors: [], elements: [] };
    if (this.assets?.groupReady("ranger")) this.drawRangerSkeletal(hero, { x: 165, y: 312 }, null);
    else { symbol(ctx, s.activeHero, 164, 306, 75, COLORS[s.activeHero].dark); }
    const foe = s.foes[Math.min(s.foeIndex, 2)];
    const hit = a?.damage && age > 0.16 && age < 0.45;
    const enemy = { id: "e2", radius: 36 + foe.kind * 4, hp: foe.hp, maxHp: foe.maxHp,
      action: hit ? "hit" : a?.enemyDamage && age > 0.4 && age < 0.65 ? "attack" : null, actionTtl: hit ? (0.45 - age) * 0.6 : 0.2 };
    if (s.foeIndex < 3) {
      ctx.save();
      if (foe.kind === 1 && "filter" in ctx) ctx.filter = "hue-rotate(45deg)";
      if (foe.kind === 2 && "filter" in ctx) ctx.filter = "hue-rotate(295deg)";
      if (this.assets?.groupReady("slime")) this.drawSlimeSkeletal(enemy, { x: 429, y: 333 });
      else { ctx.fillStyle = "#ae91db"; ctx.beginPath(); ctx.ellipse(429, 333, 44, 34, 0, 0, TAU); ctx.fill(); label(ctx, "•ᴗ•", 429, 332, 24, "#fff", "center"); }
      ctx.restore();
      panel(ctx, 354, 204, 151, 39, "#fffaf7", "#edd8da", 16);
      label(ctx, foe.name, 429, 223, 16, "#786077", "center");
      panel(ctx, 359, 253, 142, 11, "#ede1eb", null, 5);
      panel(ctx, 359, 253, Math.max(1, 142 * foe.hp / foe.maxHp), 11, "#c98dc9", null, 5);
      panel(ctx, 418, 373, 62, 31, "#fff5ef", "#f0d6d2", 13);
      label(ctx, `⚡ ${foe.countdown}`, 449, 389, 17, "#b77c93", "center");
    }
    panel(ctx, 51, 136, 158, 31, "rgba(255,255,255,.9)", null, 15);
    label(ctx, ["花间小路", "午后花园", "甜梦广场"][Math.floor((s.level - 1) / 4)], 130, 152, 14, "#7c7770", "center");
    for (let i = 0; i < 3; i++) {
      panel(ctx, 465 + i * 28, 140, 18, 18, i < s.foeIndex ? "#f3bc79" : "rgba(255,255,255,.75)", null, 9);
      if (i < s.foeIndex) label(ctx, "✓", 474 + i * 28, 149, 12, "#fff", "center");
    }
    if (attack) {
      const p = clamp(age / 0.28, 0, 1), x = 215 + 180 * p, y = 293 - Math.sin(p * Math.PI) * 32;
      ctx.strokeStyle = COLORS[s.activeHero].color; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x - 45, y + 6); ctx.lineTo(x, y); ctx.stroke();
      star(ctx, x, y, 15, COLORS[s.activeHero].light);
    }
    if (a?.damage && age < 1) label(ctx, `−${a.damage}`, 428, 192 - age * 24, 29, "#a85b99", "center", 900);
    if (a?.enemyDamage && age > 0.42 && age < 1.2) label(ctx, `−${a.enemyDamage}`, 165, 205 - age * 20, 25, "#d16480", "center", 900);
    if (a?.healed && age < 1.2) label(ctx, `+${a.healed}`, 205, 243 - age * 25, 25, "#40967c", "center", 900);
    if (a?.skills.length && age < 1.1) {
      const heroId = a.skills[0];
      panel(ctx, 210, 173, 108, 40, COLORS[heroId].light, "#fff", 20);
      label(ctx, COLORS[heroId].skill, 264, 194, 23, COLORS[heroId].dark, "center", 900);
    }
    label(ctx, "消除充能 · 满格释放", 303, 428, 13, "#796d75", "center", 600);
    ctx.restore();
    round(ctx, box.x, box.y, box.w, box.h, 26); ctx.strokeStyle = "#fffafc"; ctx.lineWidth = 3; ctx.stroke();
  }
  portrait(type, x, y, w, h) {
    const ctx = this.ctx, image = this.assets?.get("portraits");
    ctx.fillStyle = COLORS[type].light; ctx.fillRect(x, y, w, h);
    if (image) {
      const sw = image.width / 2, sh = image.height / 2, sx = (type % 2) * sw, sy = Math.floor(type / 2) * sh;
      ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
    } else symbol(ctx, type, x + w / 2, y + h / 2, 40, COLORS[type].color);
  }
  team(s) {
    const ctx = this.ctx;
    for (let i = 0; i < 4; i++) {
      const x = 38 + i * 135, y = 474, w = 126, h = 166, active = s.heroActions[i] > 0;
      panel(ctx, x, y + 4, w, h, "#dfd1e7", null, 18);
      ctx.save(); round(ctx, x, y, w, h, 18); ctx.clip();
      this.portrait(i, x, y, w, 126);
      ctx.fillStyle = "#fffafd"; ctx.fillRect(x, y + 119, w, 48);
      label(ctx, COLORS[i].name, x + 16, y + 139, 17, INK);
      symbol(ctx, i, x + w - 19, y + 138, 18, COLORS[i].color);
      ctx.fillStyle = "#ece5ef"; ctx.fillRect(x + 10, y + 154, w - 20, 5);
      ctx.fillStyle = COLORS[i].color; ctx.fillRect(x + 10, y + 154, (w - 20) * s.charges[i] / 10, 5);
      ctx.restore();
      round(ctx, x, y, w, h, 18); ctx.strokeStyle = active ? COLORS[i].dark : "#fff"; ctx.lineWidth = active ? 4 : 3; ctx.stroke();
      if (active) star(ctx, x + w - 12, y + 8, 11 + Math.sin(this.time * 12) * 3, "#ffe49b");
    }
    star(ctx, 250, 674, 9, "#e1b779");
    label(ctx, `${s.score.toLocaleString()} 分`, 272, 674, 17, "#a08aa6");
  }
  drawTile(tile, x, y, scale = 1, hinted = false) {
    const ctx = this.ctx, def = COLORS[tile.type], size = 66;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    panel(ctx, -size / 2, -size / 2 + 5, size, size, def.dark, null, 16);
    panel(ctx, -size / 2, -size / 2, size, size, def.color, hinted ? "#fffef0" : def.light, 16);
    ctx.strokeStyle = "rgba(255,255,255,.42)"; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-21, -23); ctx.lineTo(-8, -23); ctx.stroke();
    if (!tile.special) symbol(ctx, tile.type, 0, 0, 34);
    else if (tile.special === "line") {
      symbol(ctx, tile.type, 0, 0, 24);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 3;
      for (const yy of [-14, 14]) { ctx.beginPath(); ctx.moveTo(-25, yy); ctx.lineTo(25, yy); ctx.stroke(); }
      label(ctx, "↔", 0, 1, 34, "#fff", "center", 900);
    } else if (tile.special === "bomb") {
      ctx.fillStyle = "#fffaf2"; ctx.beginPath(); ctx.arc(0, 3, 18, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#fffaf2"; ctx.beginPath(); ctx.moveTo(5, -13); ctx.quadraticCurveTo(6, -26, 15, -23); ctx.stroke();
      star(ctx, 19, -22, 6, "#ffe08e"); symbol(ctx, tile.type, 0, 4, 20, def.dark);
    } else {
      for (let i = 0; i < 5; i++) { ctx.fillStyle = COLORS[i].light; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 23, i * TAU / 5, (i + 1) * TAU / 5); ctx.closePath(); ctx.fill(); }
      star(ctx, 0, 0, 16, "#fff");
    }
    if (hinted) { round(ctx, -35, -35, 70, 70, 18); ctx.strokeStyle = "#fffefa"; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.restore();
  }
  board(s) {
    const ctx = this.ctx;
    panel(ctx, 598, 119 + 5, 602, 513, "#d7cce4", null, 28);
    panel(ctx, 598, 119, 602, 513, "#fffafd", "#e3d7ec", 28);
    panel(ctx, GRID.x - 8, GRID.y - 10, GRID.cols * GRID.cell + 16, GRID.rows * GRID.cell + 10, "#e8e0f2", null, 19);
    let hint = [];
    if (s.idle > 5 || (s.movesUsed === 0 && s.level === 1)) hint = [...possibleMoves(s.board)].sort((a, b) => b.length - a.length)[0] || [];
    ctx.save(); round(ctx, GRID.x - 5, GRID.y - 9, GRID.cols * GRID.cell + 10, GRID.rows * GRID.cell + 13, 17); ctx.clip();
    const falling = s.animation ? clamp(s.animation.age / 0.45, 0, 1) : 1;
    const ease = 1 - (1 - falling) ** 3;
    s.board.forEach((tile, index) => {
      const { x, y } = tileCenter(index), row = Math.floor(index / GRID.cols);
      const offset = (tile.fromRow - row) * GRID.cell * (1 - ease);
      const isHint = hint.includes(index), scale = isHint ? 1 + Math.sin(this.time * 4) * 0.025 : 1;
      const shake = s.reject === index && s.rejectTtl > 0 ? Math.sin(this.time * 90) * 4 : 0;
      this.drawTile(tile, x + shake, y + offset, scale, isHint);
      if (s.hammerArmed) { ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.stroke(); }
    });
    ctx.restore();
  }
  effects(s) {
    const ctx = this.ctx, a = s.animation;
    if (!a || a.age > 0.7 || !a.removed.length) return;
    const p = a.age / 0.7;
    for (const tile of a.removed) {
      const center = tileCenter(tile.index);
      for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2 + tile.index, distance = 12 + p * 45;
        ctx.globalAlpha = 1 - p;
        star(ctx, center.x + Math.cos(angle) * distance, center.y + Math.sin(angle) * distance + p * p * 30, 6 * (1 - p) + 2, COLORS[tile.type].light);
      }
    }
    ctx.globalAlpha = 1;
    if (a.count >= 4) {
      ctx.save(); ctx.globalAlpha = Math.min(1, (1 - p) * 3);
      const title = a.special === "rainbow" ? "彩虹！" : a.special === "bomb" ? "大爆发！" : a.count >= 7 ? "漂亮！" : `${a.count} 连消`;
      panel(ctx, 822, 111 - p * 18, 158, 43, "#fff4d9", "#edc892", 21);
      label(ctx, title, 901, 133 - p * 18, 23, "#bd8d54", "center", 900);
      ctx.restore();
    }
  }
  footer(s) {
    const ctx = this.ctx;
    label(ctx, s.hammerArmed ? "点一下，敲碎它" : "2 连起消", 639, 668, 16, "#a18aac");
    ctx.globalAlpha = s.shuffles > 0 ? 1 : 0.45;
    button(ctx, BUTTONS.shuffle, `↝  重排 ${s.shuffles}`);
    ctx.globalAlpha = s.hammers > 0 ? 1 : 0.45;
    button(ctx, BUTTONS.hammer, `✦  小锤 ${s.hammers}`, s.hammerArmed ? "#e4d5f6" : "#fffafd");
    ctx.globalAlpha = 1;
    if (s.toastTtl > 0) {
      panel(ctx, 526, 648, 226, 43, "#79628e", null, 20);
      label(ctx, s.toast, 639, 670, 17, "#fff", "center");
    }
  }
  overlay(s) {
    if (s.phase === "playing" || (["victory", "defeat"].includes(s.phase) && s.lock > 0)) return;
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(74,51,95,.35)"; ctx.fillRect(0, 0, 1280, 720);
    if (s.phase === "levels") {
      panel(ctx, 334, 135, 626, 384, "#fffafd", "#fff", 30);
      label(ctx, "花间旅途", 641, 195, 29, INK, "center", 900);
      button(ctx, BUTTONS.close, "×");
      for (let i = 0; i < LEVEL_COUNT; i++) {
        const r = levelRect(i), locked = i + 1 > s.unlocked;
        panel(ctx, r.x, r.y, r.w, r.h, locked ? "#eee8f2" : i + 1 === s.level ? "#e4d6f2" : "#fff2dd", null, 18);
        label(ctx, locked ? "·" : i + 1, r.x + r.w / 2, r.y + 36, 27, locked ? "#c4b8cd" : INK, "center", 900);
        for (let j = 0; j < 3; j++) star(ctx, r.x + 27 + j * 22, r.y + 73, 8, j < s.bestStars[i] ? "#ecc47b" : "#d8cddd");
      }
      return;
    }
    panel(ctx, 414, 202, 452, 324, "#fffafd", "#fff", 32);
    const won = s.phase === "victory", paused = s.phase === "paused", all = won && s.level === LEVEL_COUNT;
    label(ctx, paused ? "休息一下" : all ? "花间旅途完成！" : won ? "漂亮，过关！" : "差一点点", 640, 269, 32, INK, "center", 900);
    if (won) for (let i = 0; i < 3; i++) star(ctx, 560 + i * 80, 346 - (i === 1 ? 9 : 0), i === 1 ? 35 : 28, i < s.stars ? "#efc575" : "#e4dce8");
    else { symbol(ctx, paused ? 3 : 4, 640, 346, 66, paused ? "#99caae" : "#ecafc7"); }
    label(ctx, won ? `${s.score.toLocaleString()} 分` : paused ? "你的进度已保留" : s.hp <= 0 ? "多消爱心，及时恢复" : "试试积攒大块消除", 640, 402, 17, MUTED, "center", 600);
    button(ctx, BUTTONS.primary, paused ? "继续" : all ? "再玩一次" : won ? "下一关  →" : "再试一次", "#ae92d1", "#fff");
  }
}
