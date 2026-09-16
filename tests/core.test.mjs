import test from "node:test";
import assert from "node:assert/strict";

import {
  TowerDefenseGame,
  BOARD,
  CARD_DEFS,
  FORM_NAMES,
  MONSTER_DEFS,
  RAGE_TURN,
  ROLE_DEFS,
  TURN_SECONDS,
  UI,
  WAVE_COUNT,
  cardRect,
  cellCenter,
} from "../src/core.js";

function tapCard(game, cardId) {
  if (game.state.selectedCardId === cardId) return;
  const index = CARD_DEFS.findIndex((card) => card.id === cardId);
  const rect = cardRect(index);
  game.handleTap(rect.x + rect.w / 2, rect.y + rect.h / 2);
}

function deploy(game, cardId, row, col) {
  tapCard(game, cardId);
  const point = cellCenter(row, col);
  return game.handleTap(point.x, point.y);
}

function addEnergy(game, cardId, unit) {
  tapCard(game, cardId);
  return game.handleTap(unit.x, unit.y);
}

function tickUi(game, seconds, step = 1 / 60) {
  const ticks = Math.ceil(seconds / step);
  for (let i = 0; i < ticks; i += 1) game.update(step);
}

test("exports a turn-based 5x9, six-wave defense state", () => {
  const game = new TowerDefenseGame(1);
  assert.equal(BOARD.rows, 5);
  assert.equal(BOARD.cols, 9);
  assert.equal(BOARD.playerCols, 7);
  assert.equal(WAVE_COUNT, 6);
  assert.ok(TURN_SECONDS >= 1 && TURN_SECONDS <= 1.25);
  assert.equal(game.state.schemaVersion, 3);
  assert.equal(game.state.wave.turn, 0);
  assert.equal(game.state.resource, 20);
  assert.equal(game.state.gateHp, 10);
});

test("deck keeps eight role cards and four dual-element-compatible energy cards", () => {
  assert.equal(CARD_DEFS.length, 12);
  assert.equal(CARD_DEFS.filter((card) => card.type === "role").length, 8);
  assert.equal(CARD_DEFS.filter((card) => card.type === "energy").length, 4);
  assert.ok(CARD_DEFS.filter((card) => card.type === "energy").every((card) => card.cost === 4));
});

test("ready begin starts wave one and immediately creates its turn-zero group", () => {
  const game = new TowerDefenseGame(2);
  const button = UI.readyStart;
  const result = game.handleTap(button.x + button.w / 2, button.y + button.h / 2);

  assert.equal(result.type, "start");
  assert.equal(game.state.phase, "playing");
  assert.equal(game.state.wave.index, 0);
  assert.equal(game.state.wave.turn, 0);
  assert.equal(game.state.enemies.length, 2);
  assert.ok(game.state.enemies.every((enemy) => [1, 3].includes(enemy.lane)));
});

test("update only expires UI effects and never advances gameplay", () => {
  const game = new TowerDefenseGame(3);
  game.state.resource = 99;
  deploy(game, "role:ranger", 2, 0);
  game.begin();
  const enemy = game.state.enemies[0];
  const snapshot = {
    x: enemy.x,
    hp: enemy.hp,
    resource: game.state.resource,
    cooldown: game.state.deck.find((slot) => slot.cardId === "role:ranger").cooldownLeft,
    turn: game.state.wave.turn,
    elapsed: game.state.wave.elapsed,
  };

  tickUi(game, 30);

  assert.equal(enemy.x, snapshot.x);
  assert.equal(enemy.hp, snapshot.hp);
  assert.equal(game.state.resource, snapshot.resource);
  assert.equal(game.state.deck.find((slot) => slot.cardId === "role:ranger").cooldownLeft, snapshot.cooldown);
  assert.equal(game.state.wave.turn, snapshot.turn);
  assert.equal(game.state.wave.elapsed, snapshot.elapsed);
});

test("playing begin advances exactly one turn and one fixed combat slice", () => {
  const game = new TowerDefenseGame(4);
  game.begin();
  const enemy = game.state.enemies[0];
  const startX = enemy.x;
  const startResource = game.state.resource;

  game.begin();

  assert.equal(game.state.wave.turn, 1);
  assert.ok(Math.abs(game.state.wave.elapsed - TURN_SECONDS) < 1e-9);
  assert.ok(Math.abs(game.state.battleTime - TURN_SECONDS) < 1e-9);
  assert.equal(game.state.resource, startResource + 2);
  assert.ok(enemy.x < startX);

  const afterOneTurn = enemy.x;
  tickUi(game, 10);
  assert.equal(enemy.x, afterOneTurn);
  assert.equal(game.state.wave.turn, 1);
});

test("one turn moves a free slime by a bounded fraction of one cell", () => {
  const game = new TowerDefenseGame(5);
  game.begin();
  const slime = game.state.enemies[0];
  const startX = slime.x;
  game.begin();

  const moved = startX - slime.x;
  const cells = moved / (BOARD.width / BOARD.cols);
  assert.ok(moved <= MONSTER_DEFS.slime.speed * TURN_SECONDS + 1e-6);
  assert.ok(cells >= 0.2 && cells <= 0.7);
});

test("each turn grants two resources and reduces every card cooldown by one", () => {
  const game = new TowerDefenseGame(6);
  deploy(game, "role:ranger", 2, 0);
  const slot = game.state.deck.find((item) => item.cardId === "role:ranger");
  assert.equal(game.state.resource, 12);
  assert.equal(slot.cooldownLeft, ROLE_DEFS.ranger.cooldown);

  game.begin();
  game.begin();

  assert.equal(game.state.resource, 14);
  assert.equal(slot.cooldownLeft, ROLE_DEFS.ranger.cooldown - 1);
});

test("integer turn schedule spawns later groups only on matching turns", () => {
  const game = new TowerDefenseGame(7);
  game.begin();
  assert.equal(game.state.enemies.length, 2);

  game.begin();
  assert.equal(game.state.wave.turn, 1);
  assert.equal(game.state.enemies.length, 2);

  game.begin();
  assert.equal(game.state.wave.turn, 2);
  assert.equal(game.state.enemies.length, 3);
});

test("deployment keeps columns 0-6, one unit per cell, and a 12-unit cap", () => {
  const game = new TowerDefenseGame(8);
  game.state.resource = 99;
  assert.equal(deploy(game, "role:ranger", 0, 7).type, "reject");

  const cells = [
    [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
    [1, 0], [1, 1], [1, 2], [1, 3], [1, 4],
  ];
  for (const [row, col] of cells) {
    game.state.resource = 99;
    game.state.deck.find((slot) => slot.cardId === "role:ranger").cooldownLeft = 0;
    assert.equal(deploy(game, "role:ranger", row, col).type, "deploy");
  }
  assert.equal(game.state.units.length, 12);

  game.state.resource = 99;
  game.state.deck.find((slot) => slot.cardId === "role:ranger").cooldownLeft = 0;
  assert.equal(deploy(game, "role:ranger", 1, 5).type, "reject");
});

test("an occupied cell rejects another defender", () => {
  const game = new TowerDefenseGame(9);
  game.state.resource = 99;
  assert.equal(deploy(game, "role:captain", 4, 6).type, "deploy");
  game.state.deck.find((slot) => slot.cardId === "role:ranger").cooldownLeft = 0;
  assert.equal(deploy(game, "role:ranger", 4, 6).type, "reject");
  assert.equal(game.state.units.length, 1);
});

test("a combat turn keeps defenders fixed and limits them to their own lane", () => {
  const game = new TowerDefenseGame(10);
  game.state.resource = 99;
  deploy(game, "role:ranger", 2, 6);
  const ranger = game.state.units[0];
  const fixed = { x: ranger.x, y: ranger.y };
  game.startWave(0);
  game.state.enemies = [];
  game.state.wave.nextSpawnIndex = 999;
  game.spawnMonster("slime", 2, 0);
  game.spawnMonster("slime", 3, 0);
  const sameLane = game.state.enemies[0];
  const otherLane = game.state.enemies[1];
  sameLane.x = ranger.x + 180;
  otherLane.x = ranger.x + 180;
  otherLane.speed = 0;
  const otherLaneHp = otherLane.hp;

  game.begin();

  assert.equal(ranger.x, fixed.x);
  assert.equal(ranger.y, fixed.y);
  assert.ok(sameLane.hp < sameLane.maxHp || !game.state.enemies.includes(sameLane));
  assert.equal(otherLane.hp, otherLaneHp);
});

test("physical blocking remains separate from ranged targeting", () => {
  const game = new TowerDefenseGame(11);
  game.state.resource = 99;
  deploy(game, "role:golem", 2, 4);
  const guard = game.state.units[0];
  game.spawnMonster("mushroom", 2, 0);
  game.spawnMonster("slime", 2, 0);
  const [mushroom, slime] = game.state.enemies;
  mushroom.x = guard.x + mushroom.range + guard.radius * 0.45;
  slime.x = guard.x + slime.range + guard.radius * 0.45;

  game.updateActors(0.05);

  assert.equal(mushroom.targetId, guard.id);
  assert.equal(mushroom.blockedById, null);
  assert.equal(slime.blockedById, guard.id);
});

test("two elements remain order independent and a third is rejected", () => {
  const evolve = (first, second) => {
    const game = new TowerDefenseGame(12);
    game.state.resource = 99;
    deploy(game, "role:ranger", 0, 0);
    const unit = game.state.units[0];
    addEnergy(game, `energy:${first}`, unit);
    addEnergy(game, `energy:${second}`, unit);
    game.state.deck.find((slot) => slot.cardId === "energy:nature").cooldownLeft = 0;
    const third = addEnergy(game, "energy:nature", unit);
    return { unit, third };
  };

  const fireIce = evolve("fire", "ice");
  const iceFire = evolve("ice", "fire");
  assert.equal(fireIce.unit.formId, "fire+ice");
  assert.equal(iceFire.unit.formId, "fire+ice");
  assert.equal(FORM_NAMES[fireIce.unit.formId], "雾爆");
  assert.equal(fireIce.unit.elements.length, 2);
  assert.equal(fireIce.third.type, "reject");
});

test("kill bounty is awarded in addition to the turn income", () => {
  const game = new TowerDefenseGame(13);
  game.state.resource = 99;
  deploy(game, "role:ranger", 2, 6);
  const ranger = game.state.units[0];
  game.state.resource = 10;
  game.startWave(0);
  game.state.enemies = [];
  game.state.wave.nextSpawnIndex = 999;
  game.spawnMonster("brute", 2, 0);
  const brute = game.state.enemies[0];
  brute.x = ranger.x + 100;
  brute.hp = 1;

  game.begin();

  assert.equal(game.state.resource, 10 + 2 + MONSTER_DEFS.brute.bounty);
  assert.equal(game.state.enemies.length, 0);
});

test("cleared waves wait indefinitely for begin before starting the next wave", () => {
  const game = new TowerDefenseGame(14);
  game.startWave(0);
  game.state.wave.nextSpawnIndex = 999;
  game.state.enemies = [];
  game.checkWaveEnd();
  assert.equal(game.state.phase, "intermission");
  assert.equal(game.state.wave.intermission, 0);
  const index = game.state.wave.index;

  tickUi(game, 120);
  assert.equal(game.state.phase, "intermission");
  assert.equal(game.state.wave.index, index);

  game.begin();
  assert.equal(game.state.phase, "playing");
  assert.equal(game.state.wave.index, 1);
  assert.equal(game.state.wave.turn, 0);
  assert.ok(game.state.enemies.length > 0);
});

test("pause resume does not consume a turn", () => {
  const game = new TowerDefenseGame(15);
  game.begin();
  game.togglePause();
  assert.equal(game.state.phase, "paused");
  game.begin();
  assert.equal(game.state.phase, "playing");
  assert.equal(game.state.wave.turn, 0);
  game.begin();
  assert.equal(game.state.wave.turn, 1);
});

test("gate defeat and final-wave victory remain terminal", () => {
  const defeat = new TowerDefenseGame(16);
  defeat.startWave(0);
  defeat.state.enemies = [];
  defeat.state.wave.nextSpawnIndex = 999;
  defeat.state.gateHp = 1;
  defeat.spawnMonster("slime", 2, 0);
  defeat.state.enemies[0].x = BOARD.x + 9;
  defeat.begin();
  assert.equal(defeat.state.phase, "defeat");
  assert.equal(defeat.state.gateHp, 0);

  const victory = new TowerDefenseGame(17);
  victory.startWave(WAVE_COUNT - 1);
  victory.state.wave.nextSpawnIndex = 999;
  victory.state.enemies = [];
  victory.checkWaveEnd();
  assert.equal(victory.state.phase, "victory");
});

test("overtime enemy damage scales with turn count", () => {
  const game = new TowerDefenseGame(18);
  game.state.resource = 99;
  deploy(game, "role:captain", 2, 4);
  const guard = game.state.units[0];
  game.spawnMonster("slime", 2, 0);
  const slime = game.state.enemies[0];

  game.state.wave.turn = RAGE_TURN;
  guard.hp = guard.maxHp;
  game.performAttack(slime, guard);
  const baseDamage = guard.maxHp - guard.hp;
  game.state.wave.turn = RAGE_TURN + 32;
  guard.hp = guard.maxHp;
  game.performAttack(slime, guard);
  assert.ok(guard.maxHp - guard.hp > baseDamage * 2.9);
});

test("skeletal action states are transient, decay through update, and stay out of saves", () => {
  const game = new TowerDefenseGame(181);
  game.state.resource = 99;
  deploy(game, "role:ranger", 2, 4);
  const ranger = game.state.units[0];
  game.spawnMonster("slime", 2, 0);
  const slime = game.state.enemies[0];
  const hpAfterOneHit = slime.hp - ranger.attack;

  game.performAttack(ranger, slime);

  assert.equal(ranger.action, "attack");
  assert.ok(Math.abs(ranger.actionTtl - 0.32) < 1e-9);
  assert.equal(slime.action, "hit");
  assert.ok(Math.abs(slime.actionTtl - 0.18) < 1e-9);
  assert.equal(slime.hp, hpAfterOneHit);

  const saved = JSON.parse(game.serialize());
  assert.equal("action" in saved.units[0], false);
  assert.equal("actionTtl" in saved.enemies[0], false);
  const fixedX = slime.x;
  for (let i = 0; i < 8; i += 1) game.update(0.05);

  assert.equal(ranger.action, null);
  assert.equal(ranger.actionTtl, 0);
  assert.equal(slime.action, null);
  assert.equal(slime.actionTtl, 0);
  assert.equal(slime.x, fixedX);
  assert.equal(slime.hp, hpAfterOneHit);

  slime.hp = 1;
  game.performAttack(ranger, slime);
  assert.equal(slime.action, "down");
  assert.ok(Math.abs(slime.actionTtl - 0.7) < 1e-9);
});

test("schema v3 restores turn state and rejects realtime schema v2", () => {
  const game = new TowerDefenseGame(19);
  game.begin();
  game.begin();
  const serialized = game.serialize();

  const restored = new TowerDefenseGame();
  assert.equal(restored.restore(serialized), true);
  assert.equal(restored.state.schemaVersion, 3);
  assert.equal(restored.state.wave.turn, 1);
  assert.ok(Math.abs(restored.state.wave.elapsed - TURN_SECONDS) < 1e-9);

  const old = JSON.parse(serialized);
  old.schemaVersion = 2;
  assert.equal(new TowerDefenseGame().restore(old), false);
});
