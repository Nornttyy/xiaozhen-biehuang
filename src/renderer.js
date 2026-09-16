import {
  BOARD,
  CARD_DEFS,
  ELEMENTS,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  UI,
  WAVE_COUNT,
  WAVE_DURATION,
  cardRect,
} from "./core.js";

const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function hexToRgba(hex, alpha) {
  const raw = String(hex || "#ffffff").replace("#", "");
  const expanded = raw.length === 3 ? raw.split("").map((char) => char + char).join("") : raw;
  const value = Number.parseInt(expanded, 16);
  if (!Number.isFinite(value)) return `rgba(255,255,255,${alpha})`;
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function drawDiamond(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = color;
  roundedRect(ctx, -size / 2, -size / 2, size, size, 3);
  ctx.fill();
  ctx.restore();
}

function entityNumber(entity) {
  const value = Number.parseInt(String(entity.id || "0").replace(/\D/g, ""), 10);
  return Number.isFinite(value) ? value : 0;
}

function actorPosition(actor) {
  if (Number.isFinite(actor.x) && Number.isFinite(actor.y)) return { x: actor.x, y: actor.y };
  const col = clamp(actor.col ?? 0, 0, BOARD.cols - 1);
  const row = clamp(actor.row ?? actor.lane ?? 0, 0, BOARD.rows - 1);
  return {
    x: BOARD.x + (BOARD.width / BOARD.cols) * (col + 0.5),
    y: BOARD.y + (BOARD.height / BOARD.rows) * (row + 0.5),
  };
}

export class CanvasRenderer {
  constructor(context) {
    this.ctx = context;
    this.time = 0;
  }

  draw(state, dt = 0) {
    this.time += dt;
    this.ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    this.drawBackdrop();
    this.drawBoard(state);
    this.drawActors(state);
    this.drawProjectiles(state.projectiles || []);
    this.drawEffects(state.effects || []);
    this.drawHud(state);
    this.drawCards(state);
    this.drawPhase(state);
  }

  drawBackdrop() {
    const ctx = this.ctx;
    const sky = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    sky.addColorStop(0, "#9bd9dc");
    sky.addColorStop(0.48, "#d8e8bc");
    sky.addColorStop(1, "#294d3d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.fillStyle = "rgba(255,238,173,.72)";
    ctx.beginPath();
    ctx.arc(1018, 78, 66, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#70a277";
    ctx.beginPath();
    ctx.moveTo(0, 168);
    ctx.quadraticCurveTo(205, 54, 418, 174);
    ctx.quadraticCurveTo(650, 44, 853, 164);
    ctx.quadraticCurveTo(1080, 38, 1280, 155);
    ctx.lineTo(1280, 280);
    ctx.lineTo(0, 280);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#426e59";
    for (let i = 0; i < 19; i += 1) {
      const x = 12 + i * 73 + (i % 3) * 13;
      const y = 148 + (i % 4) * 8;
      ctx.beginPath();
      ctx.moveTo(x, y + 44);
      ctx.lineTo(x + 18, y);
      ctx.lineTo(x + 36, y + 44);
      ctx.closePath();
      ctx.fill();
    }

    for (let i = 0; i < 5; i += 1) {
      const x = -16 + i * 58;
      const y = 182 + (i % 2) * 16;
      ctx.fillStyle = i % 2 ? "#e0c08a" : "#f0d49a";
      ctx.fillRect(x, y, 48, 45);
      ctx.fillStyle = i % 2 ? "#a94e43" : "#c25b48";
      ctx.beginPath();
      ctx.moveTo(x - 6, y + 2);
      ctx.lineTo(x + 24, y - 22);
      ctx.lineTo(x + 54, y + 2);
      ctx.closePath();
      ctx.fill();
    }

    const lower = ctx.createLinearGradient(0, 548, 0, LOGICAL_HEIGHT);
    lower.addColorStop(0, "rgba(27,55,46,0)");
    lower.addColorStop(0.2, "rgba(19,38,34,.88)");
    lower.addColorStop(1, "#10251f");
    ctx.fillStyle = lower;
    ctx.fillRect(0, 535, LOGICAL_WIDTH, LOGICAL_HEIGHT - 535);
  }

  drawBoard(state) {
    const ctx = this.ctx;
    const cellW = BOARD.width / BOARD.cols;
    const cellH = BOARD.height / BOARD.rows;
    const selected = CARD_DEFS.find((card) => card.id === state.selectedCardId);
    const occupied = new Set((state.units || []).map((unit) => {
      if (Number.isFinite(unit.row) && Number.isFinite(unit.col)) return `${unit.row}:${unit.col}`;
      const at = actorPosition(unit);
      return `${clamp(Math.floor((at.y - BOARD.y) / cellH), 0, BOARD.rows - 1)}:${clamp(Math.floor((at.x - BOARD.x) / cellW), 0, BOARD.cols - 1)}`;
    }));

    ctx.save();
    ctx.shadowColor = "rgba(28,39,25,.42)";
    ctx.shadowBlur = 18;
    roundedRect(ctx, BOARD.x - 8, BOARD.y - 8, BOARD.width + 16, BOARD.height + 16, 22);
    ctx.fillStyle = "#72523a";
    ctx.fill();
    ctx.shadowBlur = 0;
    roundedRect(ctx, BOARD.x, BOARD.y, BOARD.width, BOARD.height, 15);
    ctx.clip();
    ctx.fillStyle = "#78aa62";
    ctx.fillRect(BOARD.x, BOARD.y, BOARD.width, BOARD.height);

    for (let row = 0; row < BOARD.rows; row += 1) {
      const y = BOARD.y + row * cellH;
      ctx.fillStyle = row % 2 ? "#cfb274" : "#d9bf82";
      roundedRect(ctx, BOARD.x - 4, y + 6, BOARD.width + 8, cellH - 12, 18);
      ctx.fill();
      ctx.fillStyle = "rgba(255,248,209,.16)";
      ctx.fillRect(BOARD.x, y + 10, BOARD.width, 3);
      ctx.fillStyle = "rgba(80,76,46,.13)";
      for (let mark = 0; mark < 10; mark += 1) {
        const px = BOARD.x + ((mark * 137 + row * 61) % Math.max(1, BOARD.width - 24)) + 12;
        const py = y + 22 + ((mark * 29 + row * 11) % Math.max(1, cellH - 42));
        ctx.beginPath();
        ctx.ellipse(px, py, 3 + (mark % 3), 1.5, 0.3, 0, TAU);
        ctx.fill();
      }
    }

    const deployWidth = cellW * BOARD.playerCols;
    const deployTint = ctx.createLinearGradient(BOARD.x, 0, BOARD.x + deployWidth, 0);
    deployTint.addColorStop(0, "rgba(89,196,135,.18)");
    deployTint.addColorStop(1, "rgba(95,211,157,.06)");
    ctx.fillStyle = deployTint;
    ctx.fillRect(BOARD.x, BOARD.y, deployWidth, BOARD.height);
    const danger = ctx.createLinearGradient(BOARD.x + BOARD.width - cellW * 1.8, 0, BOARD.x + BOARD.width, 0);
    danger.addColorStop(0, "rgba(112,55,74,0)");
    danger.addColorStop(1, "rgba(116,42,69,.31)");
    ctx.fillStyle = danger;
    ctx.fillRect(BOARD.x + BOARD.width - cellW * 1.8, BOARD.y, cellW * 1.8, BOARD.height);

    for (let row = 0; row < BOARD.rows; row += 1) {
      for (let col = 0; col < BOARD.cols; col += 1) {
        const x = BOARD.x + col * cellW;
        const y = BOARD.y + row * cellH;
        const deployable = col < BOARD.playerCols;
        const isOccupied = occupied.has(`${row}:${col}`);
        if (selected?.type === "role" && deployable && !isOccupied) {
          const pulse = 0.13 + Math.sin(this.time * 5 + row * 0.7 + col) * 0.035;
          ctx.fillStyle = hexToRgba(selected.color, pulse);
          roundedRect(ctx, x + 5, y + 7, cellW - 10, cellH - 14, 12);
          ctx.fill();
        }
        ctx.strokeStyle = deployable ? "rgba(245,255,226,.4)" : "rgba(255,245,213,.18)";
        ctx.lineWidth = deployable ? 1.5 : 1;
        roundedRect(ctx, x + 4.5, y + 6.5, cellW - 9, cellH - 13, 10);
        ctx.stroke();
        if (isOccupied && selected?.type === "role") {
          ctx.fillStyle = "rgba(46,55,42,.16)";
          roundedRect(ctx, x + 6, y + 8, cellW - 12, cellH - 16, 10);
          ctx.fill();
        }
      }
    }

    const fenceX = BOARD.x + deployWidth;
    ctx.strokeStyle = "rgba(85,58,35,.58)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(fenceX, BOARD.y);
    ctx.lineTo(fenceX, BOARD.y + BOARD.height);
    ctx.stroke();
    ctx.fillStyle = "#a77548";
    for (let row = 0; row <= BOARD.rows; row += 1) {
      const y = BOARD.y + row * cellH;
      ctx.fillRect(fenceX - 6, y - 8, 12, 16);
    }

    ctx.fillStyle = "rgba(107,52,68,.42)";
    for (let row = 0; row < BOARD.rows; row += 1) {
      const y = BOARD.y + cellH * (row + 0.5);
      ctx.beginPath();
      ctx.moveTo(BOARD.x + BOARD.width - 17, y);
      ctx.lineTo(BOARD.x + BOARD.width - 3, y - 9);
      ctx.lineTo(BOARD.x + BOARD.width - 3, y + 9);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    this.drawTownGate(state);
    this.drawMonsterEntry();
  }

  drawTownGate(state) {
    const ctx = this.ctx;
    const x = BOARD.x - 15;
    const top = BOARD.y - 12;
    const h = BOARD.height + 24;
    ctx.save();
    ctx.shadowColor = "rgba(18,25,18,.4)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#9a7654";
    roundedRect(ctx, x - 27, top, 36, h, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#c7a36e";
    for (let y = top + 8, index = 0; y < top + h - 7; y += 25, index += 1) {
      ctx.fillRect(x - 23 + (index % 2) * 4, y, 28, 17);
    }
    ctx.fillStyle = "#69472f";
    for (let row = 0; row < BOARD.rows; row += 1) {
      const cy = BOARD.y + (BOARD.height / BOARD.rows) * (row + 0.5);
      roundedRect(ctx, x - 10, cy - 23, 22, 46, 6);
      ctx.fill();
      ctx.strokeStyle = "#d6b779";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 7, cy - 12);
      ctx.lineTo(x + 9, cy - 3);
      ctx.moveTo(x - 7, cy + 8);
      ctx.lineTo(x + 9, cy + 17);
      ctx.stroke();
    }
    const hp = Math.max(0, state.gateHp || 0);
    const maxHp = Math.max(1, state.gateMaxHp || 3);
    for (let i = 0; i < maxHp; i += 1) {
      const cy = BOARD.y + BOARD.height / 2 + (i - (maxHp - 1) / 2) * 27;
      ctx.globalAlpha = i < hp ? 1 : 0.2;
      ctx.fillStyle = i < hp ? "#72dfac" : "#32433b";
      ctx.beginPath();
      ctx.moveTo(x - 35, cy - 9);
      ctx.lineTo(x - 25, cy - 5);
      ctx.lineTo(x - 27, cy + 7);
      ctx.lineTo(x - 35, cy + 13);
      ctx.lineTo(x - 43, cy + 7);
      ctx.lineTo(x - 45, cy - 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawMonsterEntry() {
    const ctx = this.ctx;
    const x = BOARD.x + BOARD.width + 3;
    const y = BOARD.y + BOARD.height / 2;
    const pulse = 0.82 + Math.sin(this.time * 2.8) * 0.08;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, 1);
    ctx.strokeStyle = "rgba(101,52,91,.72)";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, BOARD.height * 0.45, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(232,104,143,.46)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, BOARD.height * 0.42, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  drawActors(state) {
    const selected = CARD_DEFS.find((card) => card.id === state.selectedCardId);
    const actors = [
      ...(state.units || []).map((actor) => ({ actor, side: "ally", position: actorPosition(actor) })),
      ...(state.enemies || []).map((actor) => ({ actor, side: "enemy", position: actorPosition(actor) })),
    ].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
    for (const entry of actors) {
      if (entry.side === "ally") this.drawAlly(entry.actor, entry.position, selected);
      else this.drawMonster(entry.actor, entry.position);
    }
  }

  drawAlly(unit, position, selectedCard) {
    const ctx = this.ctx;
    const radius = unit.radius || 21;
    const x = position.x;
    const y = position.y + Math.sin(this.time * 3.4 + entityNumber(unit)) * 1.6;
    ctx.save();
    ctx.translate(x, y);
    if (selectedCard?.type === "energy" && (unit.elements?.length || 0) < 2) {
      ctx.strokeStyle = hexToRgba(selectedCard.color, 0.62 + Math.sin(this.time * 6) * 0.14);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 13, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = hexToRgba(selectedCard.color, 0.1);
      ctx.beginPath();
      ctx.arc(0, 0, radius + 10, 0, TAU);
      ctx.fill();
    }
    (unit.formColors || []).forEach((color, index) => {
      ctx.strokeStyle = hexToRgba(color, 0.62);
      ctx.lineWidth = 3;
      ctx.beginPath();
      const start = this.time * (index ? -1.3 : 1.5) + index * Math.PI;
      ctx.arc(0, 0, radius + 6 + index * 4, start, start + Math.PI * 1.18);
      ctx.stroke();
    });
    ctx.fillStyle = "rgba(38,42,28,.27)";
    ctx.beginPath();
    ctx.ellipse(0, radius * 0.86, radius, radius * 0.32, 0, 0, TAU);
    ctx.fill();

    const hitColor = unit.hitFlash > 0 ? "#ffffff" : unit.color;
    ctx.fillStyle = "#403443";
    ctx.beginPath();
    ctx.arc(0, -radius * 0.42, radius * 0.65, Math.PI, TAU);
    ctx.lineTo(radius * 0.58, radius * 0.2);
    ctx.lineTo(-radius * 0.58, radius * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = unit.hitFlash > 0 ? "#ffffff" : "#ffe1ca";
    ctx.beginPath();
    ctx.arc(0, -radius * 0.38, radius * 0.49, 0, TAU);
    ctx.fill();
    ctx.fillStyle = hitColor;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.67, radius * 0.84);
    ctx.quadraticCurveTo(-radius * 0.45, radius * 0.04, 0, -radius * 0.02);
    ctx.quadraticCurveTo(radius * 0.45, radius * 0.04, radius * 0.67, radius * 0.84);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.72)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#49363c";
    ctx.beginPath();
    ctx.arc(-radius * 0.18, -radius * 0.4, 1.4, 0, TAU);
    ctx.arc(radius * 0.18, -radius * 0.4, 1.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(27,33,35,.72)";
    ctx.beginPath();
    ctx.arc(0, radius * 0.38, radius * 0.29, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${Math.max(11, radius * 0.58)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(unit.glyph || "•", 0, radius * 0.4);
    ctx.restore();
    this.drawHealth(unit, x, position.y, "ally");
    this.drawElements(unit, x, position.y);
  }

  drawMonster(enemy, position) {
    const ctx = this.ctx;
    const radius = enemy.radius || 20;
    const x = position.x;
    const y = position.y + Math.sin(this.time * 3 + entityNumber(enemy)) * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(42,31,37,.28)";
    ctx.beginPath();
    ctx.ellipse(0, radius * 0.9, radius, radius * 0.34, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = enemy.hitFlash > 0 ? "#ffffff" : enemy.color;
    ctx.strokeStyle = "rgba(72,38,59,.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-radius, radius * 0.38);
    ctx.quadraticCurveTo(-radius * 1.03, -radius * 0.58, -radius * 0.44, -radius * 0.83);
    ctx.quadraticCurveTo(0, -radius * 1.12, radius * 0.44, -radius * 0.83);
    ctx.quadraticCurveTo(radius * 1.03, -radius * 0.58, radius, radius * 0.38);
    ctx.quadraticCurveTo(radius * 0.62, radius, 0, radius * 0.82);
    ctx.quadraticCurveTo(-radius * 0.62, radius, -radius, radius * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.73, -radius * 0.61);
    ctx.lineTo(-radius * 0.31, -radius * 1.2);
    ctx.lineTo(-radius * 0.06, -radius * 0.69);
    ctx.moveTo(radius * 0.73, -radius * 0.61);
    ctx.lineTo(radius * 0.31, -radius * 1.2);
    ctx.lineTo(radius * 0.06, -radius * 0.69);
    ctx.fill();
    ctx.fillStyle = "#26192a";
    ctx.beginPath();
    ctx.ellipse(-radius * 0.3, -radius * 0.15, 3.2, 4.2, -0.2, 0, TAU);
    ctx.ellipse(radius * 0.3, -radius * 0.15, 3.2, 4.2, 0.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#4a263a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, radius * 0.21, radius * 0.22, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.restore();
    this.drawHealth(enemy, x, position.y, "enemy");
  }

  drawHealth(actor, x, y, side) {
    const ctx = this.ctx;
    const radius = actor.radius || 20;
    const width = Math.max(34, radius * 2.15);
    const left = x - width / 2;
    const top = y - radius - 14;
    ctx.fillStyle = "rgba(35,31,25,.62)";
    roundedRect(ctx, left, top, width, 6, 3);
    ctx.fill();
    const ratio = clamp((actor.hp || 0) / Math.max(1, actor.maxHp || 1), 0, 1);
    if (ratio > 0) {
      ctx.fillStyle = side === "ally" ? "#65d69a" : "#ee687b";
      roundedRect(ctx, left + 1, top + 1, (width - 2) * ratio, 4, 2);
      ctx.fill();
    }
  }

  drawElements(unit, x, y) {
    if (!unit.elements?.length) return;
    const radius = unit.radius || 20;
    unit.elements.forEach((element, index) => {
      const definition = ELEMENTS[element];
      if (!definition) return;
      const px = x + (index - (unit.elements.length - 1) / 2) * 14;
      const py = y - radius - 24;
      this.ctx.fillStyle = "rgba(255,255,255,.72)";
      this.ctx.beginPath();
      this.ctx.arc(px, py, 6.5, 0, TAU);
      this.ctx.fill();
      drawDiamond(this.ctx, px, py, 8, definition.color);
    });
  }

  drawProjectiles(projectiles) {
    const ctx = this.ctx;
    for (const projectile of projectiles) {
      if (!Number.isFinite(projectile.x) || !Number.isFinite(projectile.y)) continue;
      const color = projectile.color || projectile.formColor || "#fff2a2";
      const vx = projectile.vx || 0;
      const vy = projectile.vy || 0;
      const length = Math.hypot(vx, vy) || 1;
      const trail = Math.min(22, length * 0.08 + 8);
      ctx.save();
      ctx.strokeStyle = hexToRgba(color, 0.38);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(projectile.x, projectile.y);
      ctx.lineTo(projectile.x - (vx / length) * trail, projectile.y - (vy / length) * trail);
      ctx.stroke();
      ctx.shadowColor = color;
      ctx.shadowBlur = 9;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius || 4, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  drawEffects(effects) {
    const ctx = this.ctx;
    for (const effect of effects) {
      const progress = 1 - effect.ttl / effect.maxTtl;
      const p = Number.isFinite(progress) ? clamp(progress, 0, 1) : 0;
      const alpha = clamp(effect.ttl / Math.min(effect.maxTtl || 0.35, 0.35), 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (effect.type === "shot") {
        const eased = 1 - (1 - p) * (1 - p);
        const x = effect.fromX + (effect.x - effect.fromX) * eased;
        const y = effect.fromY + (effect.y - effect.fromY) * eased - Math.sin(eased * Math.PI) * 12;
        ctx.strokeStyle = hexToRgba(effect.color || "#fff0a0", 0.48);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(effect.fromX + (x - effect.fromX) * 0.75, effect.fromY + (y - effect.fromY) * 0.75);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = effect.color || "#fff0a0";
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, TAU);
        ctx.fill();
      } else if (["chain", "heal"].includes(effect.type)) {
        ctx.strokeStyle = effect.type === "chain" ? "#ffe56f" : "#7cf1ae";
        ctx.lineWidth = effect.type === "chain" ? 3 : 4;
        ctx.beginPath();
        ctx.moveTo(effect.fromX, effect.fromY);
        if (effect.type === "chain") ctx.lineTo((effect.fromX + effect.x) / 2 + Math.sin(p * 22) * 8, (effect.fromY + effect.y) / 2 + Math.cos(p * 18) * 8);
        ctx.lineTo(effect.x, effect.y);
        ctx.stroke();
      } else if (["spawn", "evolve", "burst", "gate", "down"].includes(effect.type)) {
        const maxRadius = effect.type === "burst" ? effect.radius : effect.type === "evolve" ? 56 : 38;
        ctx.strokeStyle = effect.color || "#fff";
        ctx.lineWidth = effect.type === "evolve" ? 5 : 3;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 7 + maxRadius * p, 0, TAU);
        ctx.stroke();
      } else if (effect.type === "slash") {
        ctx.strokeStyle = effect.color || "#fff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 20, -0.8 + p, 1.2 + p);
        ctx.stroke();
      } else if (effect.type === "number") {
        ctx.fillStyle = effect.color;
        ctx.font = "800 14px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(effect.value), effect.x, effect.y - p * 24);
      } else if (effect.type === "banner") {
        ctx.fillStyle = "#fff9dc";
        ctx.font = "900 32px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(effect.text, LOGICAL_WIDTH / 2, 73 + Math.sin(p * Math.PI) * 5);
      }
      ctx.restore();
    }
  }

  drawHud(state) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(38,63,50,.88)";
    ctx.strokeStyle = "rgba(247,226,166,.58)";
    ctx.lineWidth = 2;
    roundedRect(ctx, 20, 12, 188, 50, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff4cc";
    ctx.font = "900 23px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("小镇别慌", 114, 37);
    ctx.fillStyle = "rgba(52,70,48,.88)";
    roundedRect(ctx, 220, 13, 124, 48, 15);
    ctx.fill();
    drawDiamond(ctx, 246, 37, 18, "#f4ce63");
    ctx.fillStyle = "#fff1ad";
    ctx.font = "900 22px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(String(state.resource), 265, 38);

    const waveNumber = state.wave?.index < 0 ? 1 : state.wave.index + 1;
    const seconds = state.phase === "ready" ? WAVE_DURATION : Math.max(0, Math.ceil(WAVE_DURATION - (state.wave?.elapsed || 0)));
    ctx.fillStyle = "rgba(48,59,46,.86)";
    roundedRect(ctx, 513, 13, 254, 48, 16);
    ctx.fill();
    ctx.fillStyle = "#f7edca";
    ctx.font = "900 18px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${waveNumber}/${WAVE_COUNT}`, 574, 38);
    ctx.fillStyle = seconds <= 8 && state.phase === "playing" ? "#ff7a78" : "#ffffff";
    ctx.font = "900 22px ui-monospace, monospace";
    ctx.fillText(String(seconds).padStart(2, "0"), 696, 38);
    UI.controls.forEach((button) => this.drawControl(button, state));
    ctx.restore();
  }

  drawControl(button, state) {
    const ctx = this.ctx;
    const active = (button.id === "pause" && state.phase === "paused") || (button.id === "start" && state.phase === "ready");
    ctx.fillStyle = active ? "rgba(104,195,135,.92)" : "rgba(48,63,50,.9)";
    ctx.strokeStyle = active ? "#d9f0a8" : "rgba(242,224,171,.42)";
    ctx.lineWidth = 1.7;
    roundedRect(ctx, button.x, button.y, button.w, button.h, 12);
    ctx.fill();
    ctx.stroke();
    const cx = button.x + button.w / 2;
    const cy = button.y + button.h / 2;
    ctx.fillStyle = active ? "#fffbd8" : "#eee7ce";
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 3;
    if (button.id === "start" || (button.id === "pause" && state.phase === "paused")) {
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 9);
      ctx.lineTo(cx + 9, cy);
      ctx.lineTo(cx - 6, cy + 9);
      ctx.closePath();
      ctx.fill();
    } else if (button.id === "pause") {
      ctx.fillRect(cx - 8, cy - 9, 5, 18);
      ctx.fillRect(cx + 3, cy - 9, 5, 18);
    } else if (button.id === "restart") {
      ctx.beginPath();
      ctx.arc(cx, cy, 9, -0.75, Math.PI * 1.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - 8);
      ctx.lineTo(cx - 10, cy + 1);
      ctx.lineTo(cx - 2, cy - 3);
      ctx.fill();
    } else if (button.id === "save") {
      ctx.strokeRect(cx - 9, cy - 9, 18, 18);
      ctx.fillRect(cx - 5, cy - 9, 10, 6);
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 3, 0, TAU);
      ctx.fill();
    }
  }

  drawCards(state) {
    const ctx = this.ctx;
    if (!CARD_DEFS.length) return;
    const first = cardRect(0);
    const last = cardRect(CARD_DEFS.length - 1);
    ctx.save();
    ctx.fillStyle = "rgba(38,58,45,.9)";
    ctx.strokeStyle = "rgba(234,214,153,.46)";
    ctx.lineWidth = 2;
    roundedRect(ctx, first.x - 10, first.y - 10, last.x + last.w - first.x + 20, first.h + 18, 18);
    ctx.fill();
    ctx.stroke();
    CARD_DEFS.forEach((card, index) => {
      const rect = cardRect(index);
      const slot = state.deck?.[index] || { cooldownLeft: 0, flash: 0 };
      const selected = state.selectedCardId === card.id;
      const affordable = state.resource >= card.cost;
      const ready = slot.cooldownLeft <= 0;
      ctx.save();
      if (slot.flash > 0) ctx.translate(Math.sin(slot.flash * 85) * 4, 0);
      if (!affordable || !ready) ctx.globalAlpha = 0.72;
      ctx.shadowColor = selected ? card.color : "rgba(0,0,0,.28)";
      ctx.shadowBlur = selected ? 17 : 5;
      ctx.fillStyle = selected ? hexToRgba(card.color, 0.35) : "#263c32";
      ctx.strokeStyle = selected ? card.color : "rgba(239,223,179,.42)";
      ctx.lineWidth = selected ? 3 : 1.5;
      roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(250,242,208,.08)";
      roundedRect(ctx, rect.x + 6, rect.y + 6, rect.w - 12, 66, 10);
      ctx.fill();

      if (card.type === "energy") {
        ctx.shadowColor = card.color;
        ctx.shadowBlur = selected ? 13 : 5;
        drawDiamond(ctx, rect.x + rect.w / 2, rect.y + 39, 38, card.color);
      } else {
        ctx.fillStyle = "#443743";
        ctx.beginPath();
        ctx.arc(rect.x + rect.w / 2, rect.y + 30, 20, Math.PI, TAU);
        ctx.lineTo(rect.x + rect.w / 2 + 18, rect.y + 52);
        ctx.lineTo(rect.x + rect.w / 2 - 18, rect.y + 52);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffe1ca";
        ctx.beginPath();
        ctx.arc(rect.x + rect.w / 2, rect.y + 30, 13, 0, TAU);
        ctx.fill();
        ctx.fillStyle = card.color;
        ctx.beginPath();
        ctx.moveTo(rect.x + rect.w / 2 - 22, rect.y + 66);
        ctx.lineTo(rect.x + rect.w / 2 - 12, rect.y + 42);
        ctx.lineTo(rect.x + rect.w / 2 + 12, rect.y + 42);
        ctx.lineTo(rect.x + rect.w / 2 + 22, rect.y + 66);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 18px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(card.glyph, rect.x + rect.w / 2, rect.y + 45);
      drawDiamond(ctx, rect.x + 18, rect.y + rect.h - 17, 12, affordable ? "#f1c95c" : "#716e62");
      ctx.fillStyle = affordable ? "#fff0a4" : "#aaa799";
      ctx.font = "900 14px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText(String(card.cost), rect.x + 29, rect.y + rect.h - 16);
      if (selected) {
        ctx.fillStyle = card.color;
        ctx.beginPath();
        ctx.moveTo(rect.x + rect.w / 2 - 7, rect.y - 7);
        ctx.lineTo(rect.x + rect.w / 2 + 7, rect.y - 7);
        ctx.lineTo(rect.x + rect.w / 2, rect.y + 1);
        ctx.closePath();
        ctx.fill();
      }
      if (!ready) {
        const ratio = clamp(slot.cooldownLeft / Math.max(0.01, card.cooldown), 0, 1);
        ctx.fillStyle = "rgba(25,27,24,.73)";
        roundedRect(ctx, rect.x, rect.y, rect.w, rect.h * ratio, 14);
        ctx.fill();
        ctx.fillStyle = "#fff9e7";
        ctx.font = "900 17px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText(slot.cooldownLeft.toFixed(1), rect.x + rect.w / 2, rect.y + 50);
      }
      ctx.restore();
    });
    ctx.restore();
  }

  drawPhase(state) {
    let title = "";
    if (state.phase === "ready") title = "▶ 开始";
    if (state.phase === "paused") title = "暂停";
    if (state.phase === "intermission") title = `${Math.max(1, Math.ceil(state.wave?.intermission || 0))}`;
    if (state.phase === "victory") title = "守住了";
    if (state.phase === "defeat") title = "失守";
    if (title) {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = "rgba(42,56,43,.76)";
      ctx.strokeStyle = "rgba(250,229,166,.5)";
      ctx.lineWidth = 2;
      roundedRect(ctx, LOGICAL_WIDTH / 2 - 79, 286, 158, 56, 18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff6d8";
      ctx.font = "900 28px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(title, LOGICAL_WIDTH / 2, 315);
      ctx.restore();
    }
    if (state.message) this.drawToast(state.message);
  }

  drawToast(text) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = "900 18px system-ui, sans-serif";
    const width = clamp(ctx.measureText(String(text)).width + 34, 58, 190);
    const x = LOGICAL_WIDTH / 2 - width / 2;
    ctx.fillStyle = "rgba(38,58,45,.92)";
    ctx.strokeStyle = "rgba(226,238,173,.55)";
    ctx.lineWidth = 1.5;
    roundedRect(ctx, x, 550, width, 34, 17);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#b9f1c8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(text), LOGICAL_WIDTH / 2, 567);
    ctx.restore();
  }
}
