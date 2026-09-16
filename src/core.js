export const LOGICAL_WIDTH = 1280;
export const LOGICAL_HEIGHT = 720;

export const BOARD = Object.freeze({
  x: 76,
  y: 88,
  width: 1128,
  height: 456,
  rows: 5,
  cols: 9,
  playerCols: 7,
});

export const UI = Object.freeze({
  cardsX: 28,
  cardsY: 594,
  cardWidth: 96,
  cardHeight: 108,
  cardGap: 6,
  readyStart: { x: 561, y: 286, w: 158, h: 56 },
  controls: [
    { id: "start", label: "开始", x: 908, y: 18, w: 68, h: 38 },
    { id: "pause", label: "暂停", x: 982, y: 18, w: 68, h: 38 },
    { id: "restart", label: "重开", x: 1056, y: 18, w: 68, h: 38 },
    { id: "save", label: "存档", x: 1130, y: 18, w: 68, h: 38 },
  ],
});

const ELEMENT_ORDER = ["fire", "ice", "lightning", "nature"];

export const ELEMENTS = Object.freeze({
  fire: { id: "fire", name: "火", color: "#ff765f", glyph: "火" },
  ice: { id: "ice", name: "冰", color: "#6bd9ff", glyph: "冰" },
  lightning: { id: "lightning", name: "雷", color: "#ffe36a", glyph: "雷" },
  nature: { id: "nature", name: "自然", color: "#75e49d", glyph: "木" },
});

export const ROLE_DEFS = Object.freeze({
  ranger: {
    id: "ranger", name: "游侠", glyph: "弓", color: "#e86955", cost: 8, cooldown: 4,
    hp: 330, attack: 36, interval: 0.82, range: 620, speed: 54, armor: 0.03,
  },
  captain: {
    id: "captain", name: "队长", glyph: "盾", color: "#5e91d7", cost: 10, cooldown: 6, block: 3,
    hp: 940, attack: 44, interval: 1.08, range: 72, speed: 42, armor: 0.16,
  },
  alchemist: {
    id: "alchemist", name: "炼金", glyph: "瓶", color: "#d785d7", cost: 9, cooldown: 5,
    hp: 440, attack: 50, interval: 1.35, range: 500, speed: 45, armor: 0.05, splash: 52,
  },
  mage: {
    id: "mage", name: "术士", glyph: "法", color: "#8b75df", cost: 12, cooldown: 7,
    hp: 390, attack: 73, interval: 1.58, range: 620, speed: 43, armor: 0.02, splash: 66,
  },
  engineer: {
    id: "engineer", name: "工匠", glyph: "机", color: "#d89a49", cost: 9, cooldown: 5,
    hp: 510, attack: 39, interval: 0.72, range: 500, speed: 47, armor: 0.08,
  },
  priest: {
    id: "priest", name: "祭司", glyph: "祷", color: "#65c9bb", cost: 10, cooldown: 6,
    hp: 450, attack: 29, interval: 1.18, range: 500, speed: 44, armor: 0.04,
    heal: 58, healInterval: 1.65, healRange: 500,
  },
  golem: {
    id: "golem", name: "石卫", glyph: "岩", color: "#8c96a3", cost: 12, cooldown: 8,
    hp: 1240, attack: 56, interval: 1.42, range: 72, speed: 31, armor: 0.22,
  },
  wolf: {
    id: "wolf", name: "林狼", glyph: "狼", color: "#70aa69", cost: 8, cooldown: 3.5,
    hp: 410, attack: 42, interval: 0.62, range: 72, speed: 76, armor: 0.04,
  },
});

export const MONSTER_DEFS = Object.freeze({
  slime: {
    id: "slime", name: "角团", glyph: "团", color: "#9b74d7",
    hp: 320, attack: 50, interval: 1 / 0.75, range: 48, speed: 56, armor: 0, bounty: 1, gateDamage: 1,
  },
  bat: {
    id: "bat", name: "夜翼", glyph: "翼", color: "#6571b4",
    hp: 380, attack: 55, interval: 0.78, range: 50, speed: 69, armor: 0.02, bounty: 1, gateDamage: 1,
  },
  mushroom: {
    id: "mushroom", name: "孢子", glyph: "菇", color: "#d2608c",
    hp: 460, attack: 60, interval: 1 / 0.55, range: 376, speed: 38, armor: 0, bounty: 1, gateDamage: 1,
  },
  brute: {
    id: "brute", name: "石兽", glyph: "兽", color: "#9b785f",
    hp: 700, attack: 125, interval: 1 / 0.45, range: 58, speed: 23, armor: 0.25, bounty: 4, gateDamage: 2,
  },
  boss: {
    id: "boss", name: "荒角王", glyph: "王", color: "#c04e66",
    hp: 2000, attack: 180, interval: 1 / 0.6, range: 72, speed: 18, armor: 0.15, bounty: 15, gateDamage: 5,
  },
});

const ROLE_CARDS = Object.values(ROLE_DEFS).map((role) => ({
  id: `role:${role.id}`,
  type: "role",
  payloadId: role.id,
  name: role.name,
  glyph: role.glyph,
  color: role.color,
  cost: role.cost,
  cooldown: role.cooldown,
}));

const ENERGY_CARDS = ELEMENT_ORDER.map((id) => ({
  id: `energy:${id}`,
  type: "energy",
  payloadId: id,
  name: ELEMENTS[id].name,
  glyph: ELEMENTS[id].glyph,
  color: ELEMENTS[id].color,
  cost: 4,
  cooldown: 6,
}));

export const CARD_DEFS = Object.freeze([...ROLE_CARDS, ...ENERGY_CARDS]);

const FORM_RECIPES = Object.freeze({
  "fire+fire": {
    name: "炽焰", hp: 1.05, attack: 1.42, rate: 1.08,
    traits: { burn: 0.34, splash: 42 }, colors: ["#ff5f4a", "#ffbc63"],
  },
  "ice+ice": {
    name: "极霜", hp: 1.28, attack: 1.12, rate: 0.95, armor: 0.14,
    traits: { slow: 0.42 }, colors: ["#5acaff", "#d9f7ff"],
  },
  "lightning+lightning": {
    name: "鸣雷", hp: 1.06, attack: 1.16, rate: 1.42,
    traits: { chain: 2 }, colors: ["#ffe76a", "#fff7c3"],
  },
  "nature+nature": {
    name: "森灵", hp: 1.52, attack: 1.08, rate: 1.02, armor: 0.06,
    traits: { regen: 0.018 }, colors: ["#55dc8a", "#c5f48d"],
  },
  "fire+ice": {
    name: "雾爆", hp: 1.16, attack: 1.28, rate: 1.1,
    traits: { slow: 0.22, splash: 64, knockback: 18 }, colors: ["#ff8063", "#75dcff"],
  },
  "fire+lightning": {
    name: "过载", hp: 1.05, attack: 1.36, rate: 1.25,
    traits: { burn: 0.2, chain: 1, splash: 38 }, colors: ["#ff6d58", "#ffe468"],
  },
  "fire+nature": {
    name: "燃芽", hp: 1.28, attack: 1.24, rate: 1.08,
    traits: { burn: 0.2, lifesteal: 0.18, regen: 0.006 }, colors: ["#ff755c", "#69df91"],
  },
  "ice+lightning": {
    name: "霜闪", hp: 1.12, attack: 1.2, rate: 1.28,
    traits: { slow: 0.28, chain: 1 }, colors: ["#66d8ff", "#ffe77a"],
  },
  "ice+nature": {
    name: "霜林", hp: 1.4, attack: 1.1, rate: 1.03, armor: 0.08,
    traits: { slow: 0.26, regen: 0.012 }, colors: ["#72dfff", "#65df91"],
  },
  "lightning+nature": {
    name: "生息", hp: 1.24, attack: 1.14, rate: 1.32,
    traits: { chain: 1, healPulse: 0.1 }, colors: ["#ffe46c", "#6ce29a"],
  },
});

export const TURN_SECONDS = 1.25;
export const RAGE_TURN = 28;

const WAVE_SPECS = Object.freeze([
  [
    [0, "slime", 1], [0, "slime", 3], [2, "slime", 1],
    [3, "slime", 3], [4, "slime", 1], [5, "slime", 3],
  ],
  [
    [0, "slime", 0], [0, "bat", 4], [1, "slime", 2], [2, "bat", 1],
    [2, "mushroom", 2], [3, "slime", 3], [4, "bat", 0], [6, "slime", 4],
  ],
  [
    [0, "slime", 1], [0, "bat", 4], [1, "slime", 2], [2, "bat", 0],
    [3, "mushroom", 3], [4, "slime", 0], [5, "slime", 4], [6, "brute", 2],
    [7, "mushroom", 1],
  ],
  [
    [0, "brute", 2], [0, "slime", 4], [1, "mushroom", 0], [2, "bat", 3],
    [3, "slime", 1], [4, "mushroom", 4], [5, "bat", 0], [6, "mushroom", 2],
    [7, "mushroom", 1], [8, "brute", 3],
  ],
  [
    [0, "brute", 0], [0, "brute", 4], [1, "mushroom", 1], [2, "mushroom", 3],
    [3, "bat", 0], [4, "bat", 4], [5, "slime", 1], [6, "slime", 2],
    [7, "mushroom", 0], [8, "mushroom", 4], [9, "brute", 2],
  ],
  [
    [0, "boss", 2], [0, "bat", 0], [0, "bat", 4], [1, "mushroom", 1],
    [2, "mushroom", 3], [3, "brute", 0], [4, "brute", 4], [5, "bat", 1],
    [6, "bat", 3], [7, "mushroom", 2],
  ],
]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const inRect = (x, y, rect) => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;

function sortedElements(elements) {
  return [...elements].sort((a, b) => ELEMENT_ORDER.indexOf(a) - ELEMENT_ORDER.indexOf(b)).join("+");
}

export function cellCenter(row, col) {
  const cellW = BOARD.width / BOARD.cols;
  const cellH = BOARD.height / BOARD.rows;
  return {
    x: BOARD.x + cellW * (col + 0.5),
    y: BOARD.y + cellH * (row + 0.5),
  };
}

export function pointToCell(x, y) {
  if (!inRect(x, y, { x: BOARD.x, y: BOARD.y, w: BOARD.width, h: BOARD.height })) return null;
  return {
    row: clamp(Math.floor((y - BOARD.y) / (BOARD.height / BOARD.rows)), 0, BOARD.rows - 1),
    col: clamp(Math.floor((x - BOARD.x) / (BOARD.width / BOARD.cols)), 0, BOARD.cols - 1),
  };
}

export function cardRect(index) {
  return {
    x: UI.cardsX + index * (UI.cardWidth + UI.cardGap),
    y: UI.cardsY,
    w: UI.cardWidth,
    h: UI.cardHeight,
  };
}

function freshState(seed = 0x51a7c3) {
  return {
    schemaVersion: 3,
    phase: "ready",
    previousPhase: "ready",
    battleTime: 0,
    resource: 20,
    resourceMax: 99,
    resourceClock: 0,
    gateHp: 10,
    gateMaxHp: 10,
    deck: CARD_DEFS.map((card) => ({ cardId: card.id, cooldownLeft: 0, flash: 0 })),
    selectedCardId: null,
    units: [],
    enemies: [],
    effects: [],
    wave: { index: -1, turn: 0, elapsed: 0, nextSpawnIndex: 0, intermission: 0 },
    rngSeed: seed >>> 0,
    nextEntityId: 1,
    message: null,
    messageTtl: 0,
  };
}

export class TowerDefenseGame {
  constructor(seed) {
    this.state = freshState(seed);
  }

  reset(seed = this.state.rngSeed || 0x51a7c3) {
    this.state = freshState(seed);
  }

  random() {
    let x = this.state.rngSeed || 1;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state.rngSeed = x >>> 0;
    return this.state.rngSeed / 4294967296;
  }

  begin() {
    const { state } = this;
    if (state.phase === "paused") {
      state.phase = state.previousPhase === "paused" ? "playing" : state.previousPhase;
      return;
    }
    if (state.phase === "ready") {
      this.startWave(0);
      return;
    }
    if (state.phase === "intermission") {
      this.startWave(state.wave.index + 1);
      return;
    }
    if (state.phase === "playing") this.advanceTurn();
  }

  togglePause() {
    const { state } = this;
    if (["victory", "defeat", "ready"].includes(state.phase)) return;
    if (state.phase === "paused") {
      state.phase = state.previousPhase;
    } else {
      state.previousPhase = state.phase;
      state.phase = "paused";
    }
  }

  pauseForVisibility() {
    if (!["paused", "ready", "victory", "defeat"].includes(this.state.phase)) this.togglePause();
  }

  startWave(index) {
    const state = this.state;
    state.wave.index = index;
    state.wave.turn = 0;
    state.wave.elapsed = 0;
    state.wave.nextSpawnIndex = 0;
    state.wave.intermission = 0;
    state.phase = "playing";
    state.units.forEach((unit) => {
      unit.hp = Math.min(unit.maxHp, unit.hp + unit.maxHp * 0.24);
      unit.targetId = null;
    });
    this.spawnForTurn(0);
    this.addEffect({ type: "banner", text: `${index + 1} / ${WAVE_SPECS.length}`, ttl: 1.2 });
  }

  update(dt) {
    dt = clamp(dt, 0, 0.05);
    this.updateUiTimers(dt);
  }

  advanceTurn() {
    const state = this.state;
    if (state.phase !== "playing") return false;

    state.wave.turn += 1;
    state.resource = Math.min(state.resourceMax, state.resource + 2);
    state.deck.forEach((slot) => {
      slot.cooldownLeft = Math.max(0, slot.cooldownLeft - 1);
    });
    this.spawnForTurn(state.wave.turn);
    this.simulateTurn(TURN_SECONDS);
    this.checkWaveEnd();
    return true;
  }

  simulateTurn(seconds = TURN_SECONDS) {
    let remaining = seconds;
    while (remaining > 0 && this.state.phase === "playing") {
      const step = Math.min(0.05, remaining);
      remaining -= step;
      this.state.battleTime += step;
      this.state.wave.elapsed += step;
      this.updateStatuses(step);
      this.updateActors(step);
      this.cleanupActors();
    }
  }

  updateUiTimers(dt) {
    const state = this.state;
    state.deck.forEach((slot) => { slot.flash = Math.max(0, slot.flash - dt); });
    state.messageTtl = Math.max(0, state.messageTtl - dt);
    if (state.messageTtl === 0) state.message = null;
    state.effects.forEach((effect) => { effect.ttl -= dt; });
    state.effects = state.effects.filter((effect) => effect.ttl > 0);
    [...state.units, ...state.enemies].forEach((actor) => {
      actor.actionTtl = Math.max(0, (actor.actionTtl || 0) - dt);
      if (actor.actionTtl === 0) actor.action = null;
    });
  }

  spawnForTurn(turn) {
    const state = this.state;
    const spec = WAVE_SPECS[state.wave.index];
    while (state.wave.nextSpawnIndex < spec.length && spec[state.wave.nextSpawnIndex][0] <= turn) {
      const [, type, row] = spec[state.wave.nextSpawnIndex];
      this.spawnMonster(type, row, state.wave.index);
      state.wave.nextSpawnIndex += 1;
    }
  }

  updateSpawns() {
    this.spawnForTurn(this.state.wave.turn);
  }

  spawnMonster(type, row, waveIndex) {
    const def = MONSTER_DEFS[type];
    const scaleHp = type === "boss" ? 1 : 1 + waveIndex * 0.1;
    const scaleAttack = type === "boss" ? 1 : 1 + waveIndex * 0.07;
    const lane = clamp(row, 0, BOARD.rows - 1);
    const spawnCol = BOARD.cols - 1;
    const at = cellCenter(lane, spawnCol);
    const entity = {
      id: `e${this.state.nextEntityId++}`,
      side: "enemy",
      monsterId: type,
      name: def.name,
      glyph: def.glyph,
      color: def.color,
      x: at.x,
      y: at.y,
      lane,
      cellCol: spawnCol,
      radius: type === "boss" ? 32 : type === "brute" ? 25 : 20,
      hp: Math.round(def.hp * scaleHp),
      maxHp: Math.round(def.hp * scaleHp),
      attack: Math.round(def.attack * scaleAttack),
      interval: def.interval,
      range: def.range,
      speed: def.speed,
      armor: def.armor,
      bounty: def.bounty,
      gateDamage: def.gateDamage,
      attackTimer: this.random() * 0.35,
      targetId: null,
      blockedById: null,
      action: null,
      actionTtl: 0,
      statuses: {},
      hitFlash: 0,
    };
    this.state.enemies.push(entity);
    this.addEffect({ type: "spawn", x: entity.x, y: entity.y, color: entity.color, ttl: 0.45 });
  }

  updateStatuses(dt) {
    const actors = [...this.state.units, ...this.state.enemies];
    for (const actor of actors) {
      actor.hitFlash = Math.max(0, (actor.hitFlash || 0) - dt);
      const burn = actor.statuses?.burn;
      if (burn) {
        burn.ttl -= dt;
        actor.hp -= burn.dps * dt;
        if (burn.ttl <= 0) delete actor.statuses.burn;
      }
      const slow = actor.statuses?.slow;
      if (slow) {
        slow.ttl -= dt;
        if (slow.ttl <= 0) delete actor.statuses.slow;
      }
      if (actor.side === "ally" && actor.traits?.regen && actor.hp > 0) {
        actor.hp = Math.min(actor.maxHp, actor.hp + actor.maxHp * actor.traits.regen * dt);
      }
    }
  }

  updateActors(dt) {
    // Defenders never move: they only acquire enemies in their own lane and in range.
    for (const unit of this.state.units) {
      if (unit.hp <= 0) continue;
      unit.attackTimer = Math.max(0, unit.attackTimer - dt);
      if (unit.roleId === "priest" && this.tryHeal(unit)) continue;

      let target = this.state.enemies.find((enemy) =>
        enemy.id === unit.targetId && this.isDefenderTargetValid(unit, enemy));
      if (!target) {
        target = this.findLaneEnemy(unit);
        unit.targetId = target?.id || null;
      }
      if (target && unit.attackTimer <= 0) {
        unit.attackTimer += unit.interval;
        this.performAttack(unit, target);
      }
    }

    // Attack intent and physical blocking are separate: ranged attackers never
    // reserve a defender's block slot merely by choosing it as a target.
    for (const enemy of this.state.enemies) {
      if (enemy.hp <= 0) continue;
      enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
      enemy.y = cellCenter(enemy.lane, 0).y;

      let target = this.state.units.find((unit) =>
        unit.id === enemy.blockedById && this.isPhysicalBlock(enemy, unit));
      if (!target) enemy.blockedById = null;

      target ||= this.state.units.find((unit) =>
        unit.id === enemy.targetId && this.isDefenderAhead(enemy, unit));
      if (!target) {
        target = this.findLaneDefender(enemy);
        enemy.targetId = target?.id || null;
      }
      if (!target) {
        this.moveEnemyToGate(enemy, dt);
        continue;
      }

      const attackDistance = enemy.range + target.radius * 0.45;
      const gap = enemy.x - target.x;
      const isRangedEnemy = enemy.range > BOARD.width / BOARD.cols * 1.5;
      if (gap > attackDistance + 0.01) {
        this.advanceEnemy(enemy, gap - attackDistance, dt);
      } else if (isRangedEnemy) {
        enemy.blockedById = null;
        if (enemy.attackTimer <= 0) {
          enemy.attackTimer += enemy.interval;
          this.performAttack(enemy, target);
        }
      } else if (this.hasBlockSlot(enemy, target)) {
        enemy.blockedById = target.id;
        enemy.targetId = target.id;
        if (enemy.attackTimer <= 0) {
          enemy.attackTimer += enemy.interval;
          this.performAttack(enemy, target);
        }
      } else {
        enemy.targetId = null;
        const nextTarget = this.findLaneBlocker(enemy);
        if (!nextTarget) {
          this.moveEnemyToGate(enemy, dt);
          continue;
        }
        enemy.targetId = nextTarget.id;
        const nextGap = enemy.x - nextTarget.x;
        const nextDistance = enemy.range + nextTarget.radius * 0.45;
        if (nextGap > nextDistance + 0.01) {
          this.advanceEnemy(enemy, nextGap - nextDistance, dt);
        } else if (this.hasBlockSlot(enemy, nextTarget)) {
          enemy.blockedById = nextTarget.id;
          if (enemy.attackTimer <= 0) {
            enemy.attackTimer += enemy.interval;
            this.performAttack(enemy, nextTarget);
          }
        }
      }
    }
  }

  advanceEnemy(enemy, remainingDistance, dt) {
    const slowFactor = enemy.statuses?.slow ? 1 - enemy.statuses.slow.amount : 1;
    const step = Math.min(enemy.speed * slowFactor * dt, remainingDistance);
    enemy.x -= Math.max(0, step);
  }

  isDefenderAhead(enemy, unit) {
    return unit.hp > 0 && unit.lane === enemy.lane && unit.x <= enemy.x + unit.radius;
  }

  findLaneDefender(enemy) {
    return this.state.units
      .filter((unit) => this.isDefenderAhead(enemy, unit))
      .sort((a, b) => b.x - a.x || a.id.localeCompare(b.id))[0] || null;
  }

  hasBlockSlot(enemy, unit) {
    const claimed = this.state.enemies.filter((other) =>
      other.hp > 0 && other.id !== enemy.id && other.blockedById === unit.id).length;
    return claimed < (unit.blockCapacity || 1);
  }

  isPhysicalBlock(enemy, unit) {
    if (!this.isDefenderAhead(enemy, unit) || !this.hasBlockSlot(enemy, unit)) return false;
    const contactDistance = enemy.range + unit.radius * 0.45;
    return enemy.x - unit.x <= contactDistance + 0.01;
  }

  findLaneBlocker(enemy) {
    return this.state.units
      .filter((unit) => this.isDefenderAhead(enemy, unit) && this.hasBlockSlot(enemy, unit))
      .sort((a, b) => b.x - a.x || a.id.localeCompare(b.id))[0] || null;
  }

  isDefenderTargetValid(unit, enemy) {
    const forwardDistance = enemy.x - unit.x;
    return enemy.hp > 0 && enemy.lane === unit.lane && forwardDistance >= -8 &&
      forwardDistance <= unit.range + enemy.radius * 0.45;
  }

  findLaneEnemy(unit) {
    return this.state.enemies
      .filter((enemy) => this.isDefenderTargetValid(unit, enemy))
      .sort((a, b) => a.x - b.x || a.id.localeCompare(b.id))[0] || null;
  }


  tryHeal(priest) {
    if (priest.attackTimer > 0) return false;
    const wounded = this.state.units
      .filter((unit) => unit.hp > 0 && unit.hp < unit.maxHp * 0.88 && distance(priest, unit) <= ROLE_DEFS.priest.healRange)
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (!wounded) return false;
    const healAmount = Math.round(58 * (priest.attack / ROLE_DEFS.priest.attack));
    wounded.hp = Math.min(wounded.maxHp, wounded.hp + healAmount);
    priest.attackTimer = Math.max(priest.interval, ROLE_DEFS.priest.healInterval);
    this.addEffect({ type: "heal", fromX: priest.x, fromY: priest.y, x: wounded.x, y: wounded.y, ttl: 0.45 });
    return true;
  }

  moveEnemyToGate(enemy, dt) {
    const slowFactor = enemy.statuses?.slow ? 1 - enemy.statuses.slow.amount : 1;
    enemy.x -= enemy.speed * slowFactor * dt;
    if (enemy.x <= BOARD.x + 8) {
      this.state.gateHp = Math.max(0, this.state.gateHp - enemy.gateDamage);
      enemy.hp = 0;
      this.addEffect({ type: "gate", x: BOARD.x + 8, y: enemy.y, color: "#ff6677", ttl: 0.65 });
      if (this.state.gateHp <= 0) {
        this.state.phase = "defeat";
        this.state.selectedCardId = null;
      }
    }
  }

  performAttack(attacker, target) {
    const isRanged = attacker.range > 90;
    const attackPower = this.getAttackPower(attacker);
    attacker.action = "attack";
    attacker.actionTtl = 0.32;
    this.damage(target, attackPower, attacker);
    this.addEffect({
      type: isRanged ? "shot" : "slash",
      fromX: attacker.x, fromY: attacker.y, x: target.x, y: target.y,
      color: attacker.formColors?.[0] || attacker.color, ttl: isRanged ? 0.22 : 0.16,
    });

    const traits = attacker.traits || {};
    if (traits.burn && target.hp > 0) {
      target.statuses.burn = { dps: attackPower * traits.burn, ttl: 3 };
    }
    if (traits.slow && target.hp > 0) {
      target.statuses.slow = { amount: traits.slow, ttl: 2.5 };
    }
    if (traits.knockback && target.hp > 0) {
      const direction = attacker.side === "ally" ? 1 : -1;
      target.x = clamp(target.x + direction * traits.knockback, BOARD.x + 8, BOARD.x + BOARD.width - 8);
    }

    const opponents = attacker.side === "ally" ? this.state.enemies : this.state.units;
    const splashRadius = Math.max(attacker.splash || 0, traits.splash || 0);
    if (splashRadius > 0) {
      opponents.forEach((other) => {
        if (other.id !== target.id && other.hp > 0 && this.isSecondaryTargetAllowed(attacker, other) &&
          distance(target, other) <= splashRadius) {
          this.damage(other, attackPower * 0.42, attacker, true);
        }
      });
      this.addEffect({ type: "burst", x: target.x, y: target.y, radius: splashRadius, color: attacker.color, ttl: 0.26 });
    }

    if (traits.chain) {
      const chainTargets = opponents
        .filter((other) => other.id !== target.id && other.hp > 0 &&
          this.isSecondaryTargetAllowed(attacker, other) && distance(target, other) <= 150)
        .sort((a, b) => distance(target, a) - distance(target, b))
        .slice(0, traits.chain);
      let previous = target;
      chainTargets.forEach((other, index) => {
        this.damage(other, attackPower * (0.46 - index * 0.08), attacker, true);
        this.addEffect({ type: "chain", fromX: previous.x, fromY: previous.y, x: other.x, y: other.y, ttl: 0.25 });
        previous = other;
      });
    }

    if (traits.lifesteal) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attackPower * traits.lifesteal);
    if (traits.healPulse) {
      const allies = attacker.side === "ally" ? this.state.units : this.state.enemies;
      const ally = allies.filter((unit) => unit.hp > 0).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (ally) {
        ally.hp = Math.min(ally.maxHp, ally.hp + attackPower * traits.healPulse);
        this.addEffect({ type: "heal", fromX: attacker.x, fromY: attacker.y, x: ally.x, y: ally.y, ttl: 0.28 });
      }
    }
  }

  getAttackPower(attacker) {
    if (attacker.side !== "enemy") return attacker.attack;
    const overtimeTurns = Math.max(0, this.state.wave.turn - RAGE_TURN);
    return attacker.attack * (1 + overtimeTurns / 16);
  }

  isSecondaryTargetAllowed(attacker, target) {
    return attacker.side !== "ally" || target.x >= attacker.x - 8;
  }

  damage(target, rawDamage, source, secondary = false) {
    const damage = Math.max(1, rawDamage * (1 - clamp(target.armor || 0, 0, 0.72)));
    target.hp -= damage;
    target.hitFlash = 0.11;
    if (!secondary && damage >= 1) {
      this.addEffect({ type: "number", x: target.x, y: target.y - target.radius, value: Math.round(damage), color: "#ffffff", ttl: 0.55 });
    }
    if (target.hp <= 0) {
      target.hp = 0;
      target.action = "down";
      target.actionTtl = 0.7;
      source.targetId = null;
      if (source.blockedById === target.id) source.blockedById = null;
      this.addEffect({ type: "down", x: target.x, y: target.y, color: target.color, ttl: 0.5 });
    } else {
      target.action = "hit";
      target.actionTtl = 0.18;
    }
  }

  cleanupActors() {
    const deadEnemies = this.state.enemies.filter((enemy) => enemy.hp <= 0);
    deadEnemies.forEach((enemy) => {
      if (enemy.x > BOARD.x + 9) this.state.resource = Math.min(this.state.resourceMax, this.state.resource + enemy.bounty);
    });
    this.state.enemies = this.state.enemies.filter((enemy) => enemy.hp > 0);
    this.state.units = this.state.units.filter((unit) => unit.hp > 0);
  }

  checkWaveEnd() {
    if (this.state.phase !== "playing") return;
    const spec = WAVE_SPECS[this.state.wave.index];
    if (this.state.wave.nextSpawnIndex < spec.length || this.state.enemies.length > 0) return;
    if (this.state.wave.index === WAVE_SPECS.length - 1) {
      this.state.phase = "victory";
      this.state.selectedCardId = null;
      this.addEffect({ type: "banner", text: "完成", ttl: 3 });
    } else {
      this.state.phase = "intermission";
      this.state.wave.intermission = 0;
      this.addEffect({ type: "banner", text: "▶", ttl: 1 });
    }
  }

  handleTap(x, y) {
    if (["ready", "intermission"].includes(this.state.phase) && !this.state.selectedCardId && inRect(x, y, UI.readyStart)) {
      const wasReady = this.state.phase === "ready";
      this.begin();
      return { type: wasReady ? "start" : "next-wave" };
    }

    for (const button of UI.controls) {
      if (!inRect(x, y, button)) continue;
      if (button.id === "start") this.begin();
      if (button.id === "pause") this.togglePause();
      if (button.id === "restart") {
        this.reset();
        return { type: "restart" };
      }
      if (button.id === "save") return { type: "save" };
      return { type: button.id };
    }

    const cardIndex = CARD_DEFS.findIndex((_, index) => inRect(x, y, cardRect(index)));
    if (cardIndex >= 0) {
      const card = CARD_DEFS[cardIndex];
      this.state.selectedCardId = this.state.selectedCardId === card.id ? null : card.id;
      return { type: "select", cardId: this.state.selectedCardId };
    }

    const selected = CARD_DEFS.find((card) => card.id === this.state.selectedCardId);
    if (!selected || ["victory", "defeat", "paused"].includes(this.state.phase)) return null;
    if (selected.type === "role") return this.tryDeploy(selected, x, y);
    return this.tryApplyEnergy(selected, x, y);
  }

  tryDeploy(card, x, y) {
    const cell = pointToCell(x, y);
    if (!cell || cell.col >= BOARD.playerCols) return this.rejectCard(card.id);
    if (this.state.units.length >= 12) return this.rejectCard(card.id);
    const at = cellCenter(cell.row, cell.col);
    if (this.state.units.some((unit) => unit.lane === cell.row && unit.cellCol === cell.col)) return this.rejectCard(card.id);
    const slot = this.state.deck.find((item) => item.cardId === card.id);
    if (this.state.resource < card.cost || slot.cooldownLeft > 0) return this.rejectCard(card.id);

    this.state.resource -= card.cost;
    slot.cooldownLeft = card.cooldown;
    const def = ROLE_DEFS[card.payloadId];
    this.state.units.push({
      id: `u${this.state.nextEntityId++}`,
      side: "ally",
      roleId: def.id,
      name: def.name,
      glyph: def.glyph,
      color: def.color,
      x: at.x,
      y: at.y,
      lane: cell.row,
      cellCol: cell.col,
      radius: def.id === "golem" ? 26 : def.id === "wolf" ? 19 : 22,
      hp: def.hp,
      maxHp: def.hp,
      attack: def.attack,
      interval: def.interval,
      range: def.range,
      speed: def.speed,
      armor: def.armor,
      splash: def.splash || 0,
      blockCapacity: def.block || 1,
      attackTimer: 0.2,
      targetId: null,
      action: null,
      actionTtl: 0,
      statuses: {},
      hitFlash: 0,
      elements: [],
      formId: "base",
      formName: "",
      formColors: [],
      traits: {},
    });
    this.state.selectedCardId = null;
    this.addEffect({ type: "spawn", x: at.x, y: at.y, color: def.color, ttl: 0.48 });
    return { type: "deploy", roleId: def.id };
  }

  tryApplyEnergy(card, x, y) {
    const unit = this.state.units
      .filter((candidate) => candidate.hp > 0)
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (!unit || Math.hypot(unit.x - x, unit.y - y) > Math.max(46, unit.radius + 18)) return this.rejectCard(card.id);
    const slot = this.state.deck.find((item) => item.cardId === card.id);
    if (unit.elements.length >= 2 || this.state.resource < card.cost || slot.cooldownLeft > 0) return this.rejectCard(card.id);

    this.state.resource -= card.cost;
    slot.cooldownLeft = card.cooldown;
    unit.elements.push(card.payloadId);
    this.rebuildUnitForm(unit);
    this.state.selectedCardId = null;
    this.addEffect({ type: "evolve", x: unit.x, y: unit.y, color: card.color, ttl: 0.8 });
    return { type: "energy", unitId: unit.id, element: card.payloadId, formId: unit.formId };
  }

  rebuildUnitForm(unit) {
    const def = ROLE_DEFS[unit.roleId];
    const oldMaxHp = unit.maxHp;
    let hpMultiplier = 1;
    let attackMultiplier = 1;
    let rateMultiplier = 1;
    let armorBonus = 0;
    let traits = {};
    let colors = unit.elements.map((id) => ELEMENTS[id].color);
    let formName = "";

    if (unit.elements.length === 1) {
      const element = unit.elements[0];
      formName = ELEMENTS[element].name;
      if (element === "fire") { attackMultiplier = 1.12; traits = { burn: 0.14 }; }
      if (element === "ice") { hpMultiplier = 1.1; armorBonus = 0.05; traits = { slow: 0.14 }; }
      if (element === "lightning") { rateMultiplier = 1.14; traits = {}; }
      if (element === "nature") { hpMultiplier = 1.2; traits = { regen: 0.006 }; }
      unit.formId = element;
    } else if (unit.elements.length === 2) {
      const key = sortedElements(unit.elements);
      const recipe = FORM_RECIPES[key];
      hpMultiplier = recipe.hp || 1;
      attackMultiplier = recipe.attack || 1;
      rateMultiplier = recipe.rate || 1;
      armorBonus = recipe.armor || 0;
      traits = { ...recipe.traits };
      colors = recipe.colors;
      formName = recipe.name;
      unit.formId = key;
    }

    unit.maxHp = Math.round(def.hp * hpMultiplier);
    unit.hp = Math.min(unit.maxHp, unit.hp + Math.max(0, unit.maxHp - oldMaxHp));
    unit.attack = Math.round(def.attack * attackMultiplier);
    unit.interval = def.interval / rateMultiplier;
    unit.armor = clamp(def.armor + armorBonus, 0, 0.65);
    unit.traits = traits;
    unit.formColors = colors;
    unit.formName = formName;
  }

  rejectCard(cardId) {
    const slot = this.state.deck.find((item) => item.cardId === cardId);
    if (slot) slot.flash = 0.28;
    return { type: "reject", cardId };
  }

  addEffect(effect) {
    this.state.effects.push({ ...effect, maxTtl: effect.ttl });
    if (this.state.effects.length > 80) this.state.effects.splice(0, this.state.effects.length - 80);
  }

  flashSaved() {
    this.state.message = "✓";
    this.state.messageTtl = 0.8;
  }

  serialize() {
    const withoutAction = ({ action: _action, actionTtl: _actionTtl, ...actor }) => actor;
    return JSON.stringify({
      ...this.state,
      units: this.state.units.map(withoutAction),
      enemies: this.state.enemies.map(withoutAction),
      effects: [],
      selectedCardId: null,
      savedAt: Date.now(),
    });
  }

  restore(serialized) {
    try {
      const saved = typeof serialized === "string" ? JSON.parse(serialized) : serialized;
      if (!saved || saved.schemaVersion !== 3) return false;
      const next = freshState(saved.rngSeed);
      Object.assign(next, saved);
      next.effects = [];
      next.selectedCardId = null;
      next.phase = saved.phase === "paused" ? saved.previousPhase || "ready" : saved.phase;
      next.previousPhase = next.phase;
      next.wave = {
        ...freshState(saved.rngSeed).wave,
        ...(saved.wave || {}),
        turn: Math.max(0, Math.floor(saved.wave?.turn || 0)),
      };
      next.deck = CARD_DEFS.map((card) => {
        const slot = saved.deck?.find((item) => item.cardId === card.id);
        return { cardId: card.id, cooldownLeft: Math.max(0, slot?.cooldownLeft || 0), flash: 0 };
      });
      next.units = (saved.units || []).filter((unit) => ROLE_DEFS[unit.roleId]).slice(0, 12).map((unit) => {
        const cell = pointToCell(unit.x, unit.y) || { row: 0, col: 0 };
        const lane = clamp(Number.isInteger(unit.lane) ? unit.lane : cell.row, 0, BOARD.rows - 1);
        const cellCol = clamp(Number.isInteger(unit.cellCol) ? unit.cellCol : cell.col, 0, BOARD.playerCols - 1);
        const at = cellCenter(lane, cellCol);
        return {
          ...unit,
          x: at.x,
          y: at.y,
          lane,
          cellCol,
          blockCapacity: ROLE_DEFS[unit.roleId].block || 1,
          action: null,
          actionTtl: 0,
        };
      });
      next.enemies = (saved.enemies || []).filter((enemy) => MONSTER_DEFS[enemy.monsterId]).map((enemy) => {
        const fallbackLane = pointToCell(enemy.x, enemy.y)?.row || 0;
        const lane = clamp(Number.isInteger(enemy.lane) ? enemy.lane : fallbackLane, 0, BOARD.rows - 1);
        return { ...enemy, lane, y: cellCenter(lane, 0).y, action: null, actionTtl: 0 };
      });
      this.state = next;
      return true;
    } catch {
      return false;
    }
  }

  getSnapshot() {
    return JSON.parse(this.serialize());
  }
}

export const WAVE_COUNT = WAVE_SPECS.length;
export const FORM_NAMES = Object.freeze(Object.fromEntries(Object.entries(FORM_RECIPES).map(([key, value]) => [key, value.name])));
