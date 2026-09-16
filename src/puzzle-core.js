export const LOGICAL_WIDTH = 1280;
export const LOGICAL_HEIGHT = 720;
export const LEVEL_COUNT = 10;
export const GRID = Object.freeze({ x: 626, y: 156, cols: 7, rows: 6, cell: 78 });
export const COLORS = Object.freeze([
  { id: "fire", name: "小暖", skill: "焰花", color: "#f88b91", dark: "#d65e79", light: "#ffe5df" },
  { id: "ice", name: "小雪", skill: "冰息", color: "#86ccec", dark: "#4ba5d2", light: "#e4f5ff" },
  { id: "lightning", name: "星铃", skill: "星闪", color: "#b7a0ed", dark: "#8b72c4", light: "#eee6ff" },
  { id: "nature", name: "叶叶", skill: "花语", color: "#90d7b5", dark: "#57ab8c", light: "#e2f9eb" },
  { id: "heart", name: "爱心", color: "#f6afce", dark: "#d677a9", light: "#ffe7f1" },
]);
export const BUTTONS = Object.freeze({
  levels: { x: 760, y: 32, w: 144, h: 52 },
  pause: { x: 1104, y: 32, w: 52, h: 52 },
  restart: { x: 1170, y: 32, w: 52, h: 52 },
  shuffle: { x: 880, y: 643, w: 138, h: 48 },
  hammer: { x: 1030, y: 643, w: 160, h: 48 },
  primary: { x: 525, y: 438, w: 230, h: 58 },
  close: { x: 903, y: 145, w: 40, h: 40 },
});
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const inside = (x, y, rect) => x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h;
export function tileCenter(index) {
  return { x: GRID.x + (index % GRID.cols + 0.5) * GRID.cell, y: GRID.y + (Math.floor(index / GRID.cols) + 0.5) * GRID.cell };
}
export function tileAt(x, y) {
  if (!inside(x, y, { ...GRID, w: GRID.cols * GRID.cell, h: GRID.rows * GRID.cell })) return -1;
  return Math.floor((y - GRID.y) / GRID.cell) * GRID.cols + Math.floor((x - GRID.x) / GRID.cell);
}
export function levelRect(index) {
  return { x: 371 + (index % 5) * 110, y: 252 + Math.floor(index / 5) * 112, w: 98, h: 98 };
}
export function neighbors(index) {
  const list = [], row = Math.floor(index / GRID.cols), col = index % GRID.cols;
  if (row > 0) list.push(index - GRID.cols);
  if (row < GRID.rows - 1) list.push(index + GRID.cols);
  if (col > 0) list.push(index - 1);
  if (col < GRID.cols - 1) list.push(index + 1);
  return list;
}
export function connected(board, index) {
  if (!board[index]) return [];
  const type = board[index].type, found = new Set([index]), queue = [index];
  for (let n = 0; n < queue.length; n++) {
    for (const next of neighbors(queue[n])) {
      if (!found.has(next) && board[next]?.type === type) { found.add(next); queue.push(next); }
    }
  }
  return queue;
}
export function possibleMoves(board) {
  const checked = new Set(), moves = [];
  board.forEach((tile, index) => {
    if (tile.special) moves.push([index]);
    if (checked.has(index)) return;
    const group = connected(board, index);
    group.forEach((i) => checked.add(i));
    if (group.length >= 2) moves.push(group);
  });
  return moves;
}
function foesFor(level) {
  return [
    { name: "软糖团", kind: 0, maxHp: 90 + level * 17, interval: 4, attack: 8 + level },
    { name: "捣蛋团", kind: 1, maxHp: 130 + level * 20, interval: 3, attack: 9 + level },
    { name: level % 5 === 0 ? "甜梦魔王" : "大角团", kind: 2, maxHp: 180 + level * 25, interval: 3, attack: 11 + level },
  ].map((foe) => ({ ...foe, hp: foe.maxHp, countdown: foe.interval }));
}
export class PuzzleGame {
  constructor(seed = Date.now()) {
    this.seed = (seed >>> 0) || 1;
    this.state = { unlocked: 1, bestStars: Array(LEVEL_COUNT).fill(0) };
    this.startLevel(1);
  }
  random() {
    let x = this.seed;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.seed = x >>> 0;
    return this.seed / 4294967296;
  }
  newTile(fromRow = -1) {
    return { id: this.state.nextId++, type: Math.floor(this.random() * COLORS.length), special: null, fromRow };
  }
  startLevel(level) {
    level = clamp(Math.floor(level), 1, LEVEL_COUNT);
    const { unlocked, bestStars } = this.state;
    this.state = {
      schemaVersion: 4, mode: "puzzle", level, unlocked: Math.max(unlocked || 1, level), bestStars: bestStars || Array(LEVEL_COUNT).fill(0),
      phase: "playing", previousPhase: "playing", board: [], nextId: 1, moves: 25, movesUsed: 0,
      hp: 100, maxHp: 100, score: 0, foeIndex: 0, foes: foesFor(level), charges: [0, 0, 0, 0],
      activeHero: 0, heroActions: [0, 0, 0, 0], shuffles: 2, hammers: 2, hammerArmed: false,
      lock: 0, idle: 0, animation: null, stars: 0, toast: "", toastTtl: 0, reject: -1, rejectTtl: 0,
    };
    this.state.board = Array.from({ length: GRID.rows * GRID.cols }, (_, i) => this.newTile(Math.floor(i / GRID.cols)));
    if (level === 1) [0, 1, 7, 8].forEach((i) => { this.state.board[i].type = 0; });
    this.ensurePlayable();
  }
  get foe() { return this.state.foes[this.state.foeIndex] || null; }
  showToast(message) { this.state.toast = message; this.state.toastTtl = 1.5; }
  ensurePlayable() {
    if (possibleMoves(this.state.board).length) return false;
    this.shuffleBoard();
    this.showToast("换个排列");
    return true;
  }
  shuffleBoard() {
    const board = this.state.board;
    for (let pass = 0; pass < 10; pass++) {
      for (let i = board.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [board[i], board[j]] = [board[j], board[i]];
      }
      if (possibleMoves(board).length) break;
    }
    if (!possibleMoves(board).length) board[1].type = board[0].type;
    board.forEach((tile, i) => { tile.fromRow = Math.floor(i / GRID.cols) - 0.35; });
  }
  expandSpecials(indices) {
    const board = this.state.board, found = new Set(indices), queue = [...indices];
    for (let k = 0; k < queue.length; k++) {
      const index = queue[k], tile = board[index];
      if (!tile.special) continue;
      const row = Math.floor(index / GRID.cols), col = index % GRID.cols;
      board.forEach((other, i) => {
        const r = Math.floor(i / GRID.cols), c = i % GRID.cols;
        const hit = tile.special === "line" ? r === row : tile.special === "bomb" ? Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1 : other.type === tile.type;
        if (hit && !found.has(i)) { found.add(i); queue.push(i); }
      });
    }
    return [...found];
  }
  refill(removed) {
    const s = this.state, next = Array(s.board.length), removedSet = new Set(removed);
    for (let col = 0; col < GRID.cols; col++) {
      const survivors = [];
      for (let row = GRID.rows - 1; row >= 0; row--) {
        const index = row * GRID.cols + col;
        if (!removedSet.has(index)) survivors.push({ ...s.board[index], fromRow: row });
      }
      for (let row = GRID.rows - 1, n = 0; row >= 0; row--, n++) {
        next[row * GRID.cols + col] = survivors[n] || this.newTile(-(n - survivors.length + 1));
      }
    }
    s.board = next;
  }
  clear(index) {
    const s = this.state;
    if (s.phase !== "playing" || s.lock > 0 || !s.board[index]) return false;
    const hammer = s.hammerArmed;
    if (hammer && s.hammers <= 0) return false;
    const selected = s.board[index], group = hammer || selected.special ? [index] : connected(s.board, index);
    if (!hammer && !selected.special && group.length < 2) {
      s.reject = index; s.rejectTtl = 0.3; return false;
    }
    const indices = this.expandSpecials(group), counts = Array(5).fill(0);
    const removed = indices.map((i) => ({ ...s.board[i], index: i }));
    indices.forEach((i) => counts[s.board[i].type]++);
    const containsSpecial = indices.some((i) => s.board[i].special);
    const special = !hammer && !containsSpecial && group.length >= 4 ? group.length >= 7 ? "rainbow" : group.length >= 5 ? "bomb" : "line" : null;
    if (special) s.board[index] = { ...selected, special };
    this.refill(indices.filter((i) => !special || i !== index));
    if (hammer) { s.hammers--; s.hammerArmed = false; }
    else { s.moves--; s.movesUsed++; }
    s.score += indices.length * 80 + Math.max(0, indices.length - 2) ** 2 * 15;
    let damage = counts.slice(0, 4).reduce((a, b) => a + b, 0) * 13 + Math.max(0, indices.length - 2) * 7;
    let heal = counts[4] * 6, freeze = 0;
    const skills = [];
    s.activeHero = selected.type < 4 ? selected.type : 3;
    counts.slice(0, 4).forEach((amount, type) => {
      s.charges[type] += amount;
      if (amount) s.heroActions[type] = 0.65;
      while (s.charges[type] >= 10) {
        s.charges[type] -= 10;
        damage += [85, 55, 100, 60][type];
        if (type === 1) freeze += 2;
        if (type === 3) heal += 18;
        skills.push(type);
      }
    });
    const healed = Math.min(heal, s.maxHp - s.hp);
    s.hp = Math.min(s.maxHp, s.hp + heal);
    const targetBefore = s.foeIndex;
    let remainingDamage = damage;
    while (this.foe && remainingDamage > 0) {
      const hit = Math.min(this.foe.hp, remainingDamage);
      this.foe.hp -= hit; remainingDamage -= hit;
      if (this.foe.hp === 0) s.foeIndex++;
      else break;
    }
    let enemyDamage = 0;
    if (this.foe) {
      this.foe.countdown += freeze;
      if (!hammer && s.foeIndex === targetBefore) {
        this.foe.countdown--;
        if (this.foe.countdown <= 0) {
          enemyDamage = this.foe.attack;
          s.hp = Math.max(0, s.hp - enemyDamage);
          this.foe.countdown = this.foe.interval;
        }
      }
    }
    s.animation = { age: 0, duration: 0.7, removed, count: indices.length, type: selected.type, special, damage, healed, enemyDamage, skills, defeated: s.foeIndex > targetBefore };
    s.lock = 0.5; s.idle = 0;
    if (!this.foe) {
      s.phase = "victory";
      s.stars = s.hp >= 60 && s.moves >= 7 ? 3 : s.hp >= 30 ? 2 : 1;
      s.bestStars[s.level - 1] = Math.max(s.bestStars[s.level - 1], s.stars);
      s.unlocked = Math.max(s.unlocked, Math.min(LEVEL_COUNT, s.level + 1));
    } else if (s.hp <= 0 || s.moves <= 0) {
      s.phase = "defeat";
    } else this.ensurePlayable();
    return true;
  }
  shuffle() {
    const s = this.state;
    if (s.phase !== "playing" || s.lock > 0 || s.shuffles <= 0) return false;
    s.shuffles--; s.hammerArmed = false; s.idle = 0;
    this.shuffleBoard(); s.lock = 0.35;
    s.animation = { age: 0, duration: 0.45, removed: [], count: 0, skills: [], damage: 0 };
    return true;
  }
  togglePause() {
    const s = this.state;
    if (s.phase === "playing") { s.phase = "paused"; s.hammerArmed = false; }
    else if (s.phase === "paused") s.phase = "playing";
  }
  pauseForVisibility() { if (this.state.phase === "playing") this.togglePause(); }
  update(dt) {
    const s = this.state;
    if (s.phase === "paused" || s.phase === "levels") return;
    dt = clamp(dt, 0, 0.1);
    s.lock = Math.max(0, s.lock - dt); s.idle += dt;
    s.toastTtl = Math.max(0, s.toastTtl - dt); s.rejectTtl = Math.max(0, s.rejectTtl - dt);
    s.heroActions = s.heroActions.map((v) => Math.max(0, v - dt));
    if (s.animation) { s.animation.age += dt; if (s.animation.age > 1.3) s.animation = null; }
  }
  handleTap(x, y) {
    const s = this.state;
    if (s.phase === "levels") {
      if (inside(x, y, BUTTONS.close)) { s.phase = s.previousPhase; return { type: "menu-close" }; }
      for (let i = 0; i < s.unlocked; i++) if (inside(x, y, levelRect(i))) { this.startLevel(i + 1); return { type: "level" }; }
      return null;
    }
    if (inside(x, y, BUTTONS.levels)) { s.previousPhase = s.phase; s.phase = "levels"; s.hammerArmed = false; return { type: "menu" }; }
    if (inside(x, y, BUTTONS.pause)) { this.togglePause(); return { type: "pause" }; }
    if (inside(x, y, BUTTONS.restart)) { this.startLevel(s.level); return { type: "restart" }; }
    if (s.phase !== "playing") {
      if ((s.phase !== "paused" && s.lock > 0) || !inside(x, y, BUTTONS.primary)) return null;
      if (s.phase === "paused") this.togglePause();
      else this.startLevel(s.phase === "victory" ? Math.min(LEVEL_COUNT, s.level + 1) : s.level);
      return { type: "continue" };
    }
    if (s.lock > 0) return null;
    if (inside(x, y, BUTTONS.shuffle)) return this.shuffle() ? { type: "shuffle" } : null;
    if (inside(x, y, BUTTONS.hammer)) {
      if (s.hammers > 0) s.hammerArmed = !s.hammerArmed;
      return { type: "hammer-arm" };
    }
    const index = tileAt(x, y);
    return index >= 0 && this.clear(index) ? { type: "clear" } : null;
  }
  serialize() {
    const s = this.state;
    return JSON.stringify({ ...s, rngSeed: this.seed, phase: s.phase === "levels" ? s.previousPhase : s.phase,
      lock: 0, animation: null, idle: 0, toast: "", toastTtl: 0, hammerArmed: false, heroActions: [0, 0, 0, 0] });
  }
  restore(serialized) {
    try {
      const s = typeof serialized === "string" ? JSON.parse(serialized) : serialized;
      const integer = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
      if (!s || s.schemaVersion !== 4 || s.mode !== "puzzle" || !integer(s.level, 1, LEVEL_COUNT) || !integer(s.unlocked, s.level, LEVEL_COUNT)) return false;
      if (!["playing", "paused", "victory", "defeat"].includes(s.phase) || !Array.isArray(s.board) || s.board.length !== 42) return false;
      if (!s.board.every((tile) => tile && integer(tile.id, 1, 1e9) && integer(tile.type, 0, 4) && [null, "line", "bomb", "rainbow"].includes(tile.special))) return false;
      if (new Set(s.board.map((tile) => tile.id)).size !== 42 || !integer(s.nextId, Math.max(...s.board.map((t) => t.id)) + 1, 1e9)) return false;
      if (!integer(s.hp, 0, 100) || s.maxHp !== 100 || !integer(s.moves, 0, 25) || !integer(s.movesUsed, 0, 25) || s.moves + s.movesUsed !== 25) return false;
      if (!integer(s.foeIndex, 0, 3) || !Array.isArray(s.foes) || s.foes.length !== 3) return false;
      if (!s.foes.every((f) => f && Number.isFinite(f.hp) && f.hp >= 0 && Number.isFinite(f.maxHp) && f.maxHp > 0 && f.hp <= f.maxHp && integer(f.countdown, 1, 100) && integer(f.interval, 1, 10) && integer(f.attack, 1, 100))) return false;
      if (!Array.isArray(s.charges) || s.charges.length !== 4 || !s.charges.every((v) => integer(v, 0, 9))) return false;
      if (!Array.isArray(s.bestStars) || s.bestStars.length !== LEVEL_COUNT || !s.bestStars.every((v) => integer(v, 0, 3))) return false;
      if (!integer(s.shuffles, 0, 2) || !integer(s.hammers, 0, 2) || !integer(s.score, 0, 1e9) || !integer(s.activeHero, 0, 3) || !integer(s.stars, 0, 3)) return false;
      if (["playing", "paused"].includes(s.phase) && (s.hp <= 0 || s.moves <= 0 || s.foeIndex === 3 || s.foes[s.foeIndex].hp <= 0)) return false;
      if (s.phase === "victory" && s.foeIndex !== 3) return false;
      this.state = { ...s, board: s.board.map((tile, i) => ({ ...tile, fromRow: Math.floor(i / GRID.cols) })),
        lock: 0, animation: null, idle: 0, toast: "", toastTtl: 0, rejectTtl: 0, hammerArmed: false, heroActions: [0, 0, 0, 0] };
      this.seed = (s.rngSeed >>> 0) || 1;
      this.ensurePlayable();
      return true;
    } catch { return false; }
  }
}
