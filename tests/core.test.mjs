import test from "node:test";
import assert from "node:assert/strict";

import {
  TowerDefenseGame,
  BOARD,
  CARD_DEFS,
  FORM_NAMES,
  MONSTER_DEFS,
  ROLE_DEFS,
  UI,
  WAVE_COUNT,
  WAVE_DURATION,
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

function advance(game, seconds, step = 1 / 60) {
  const ticks = Math.ceil(seconds / step);
  for (let i = 0; i < ticks; i += 1) game.update(step);
}

test("exports a tower-defense game with a 5x9 board", () => {
  const game = new TowerDefenseGame(1);
  assert.ok(game instanceof TowerDefenseGame);
  assert.equal(BOARD.rows, 5);
  assert.equal(BOARD.cols, 9);
  assert.equal(BOARD.playerCols, 7);
  assert.equal(WAVE_COUNT, 6);
  assert.equal(game.state.schemaVersion, 2);
  assert.equal(game.state.resource, 20);
  assert.equal(game.state.gateHp, 10);
});

test("deck keeps eight role cards and four four-point energy cards", () => {
  assert.equal(CARD_DEFS.length, 12);
  assert.equal(CARD_DEFS.filter((card) => card.type === "role").length, 8);
  assert.equal(CARD_DEFS.filter((card) => card.type === "energy").length, 4);
  assert.ok(CARD_DEFS.filter((card) => card.type === "role").every((card) => card.cost >= 8 && card.cost <= 12));
  assert.ok(CARD_DEFS.filter((card) => card.type === "energy").every((card) => card.cost === 4));
});

test("the centered ready control starts the first wave", () => {
  const game = new TowerDefenseGame(21);
  const button = UI.readyStart;
  const result = game.handleTap(button.x + button.w / 2, button.y + button.h / 2);
  assert.equal(result.type, "start");
  assert.equal(game.state.phase, "playing");
  assert.equal(game.state.wave.index, 0);
});

test("deployment uses columns 0-6, one defender per cell, with a 12-unit cap", () => {
  const game = new TowerDefenseGame(2);
  game.state.resource = 99;

  const outside = deploy(game, "role:ranger", 0, 7);
  assert.equal(outside.type, "reject");
  assert.equal(game.state.units.length, 0);

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
  assert.deepEqual(
    game.state.units.map((unit) => [unit.lane, unit.cellCol]),
    cells,
  );

  game.state.resource = 99;
  game.state.deck.find((slot) => slot.cardId === "role:ranger").cooldownLeft = 0;
  assert.equal(deploy(game, "role:ranger", 1, 5).type, "reject");
  assert.equal(game.state.units.length, 12);
});

test("an occupied cell rejects a second defender even below the unit cap", () => {
  const game = new TowerDefenseGame(3);
  game.state.resource = 99;
  assert.equal(deploy(game, "role:captain", 4, 6).type, "deploy");
  game.state.deck.find((slot) => slot.cardId === "role:ranger").cooldownLeft = 0;
  assert.equal(deploy(game, "role:ranger", 4, 6).type, "reject");
  assert.equal(game.state.units.length, 1);
});

test("defenders remain fixed and only attack enemies in their own lane", () => {
  const game = new TowerDefenseGame(4);
  game.state.resource = 99;
  deploy(game, "role:ranger", 2, 6);
  const ranger = game.state.units[0];
  const fixed = { x: ranger.x, y: ranger.y };

  game.startWave(0);
  game.state.wave.nextSpawnIndex = 999;
  game.spawnMonster("slime", 2, 0);
  game.spawnMonster("slime", 3, 0);
  const sameLane = game.state.enemies[0];
  const otherLane = game.state.enemies[1];
  otherLane.speed = 0;
  const otherLaneHp = otherLane.hp;

  advance(game, 2.5);

  assert.equal(ranger.x, fixed.x);
  assert.equal(ranger.y, fixed.y);
  assert.ok(sameLane.hp < sameLane.maxHp || !game.state.enemies.includes(sameLane));
  assert.equal(otherLane.hp, otherLaneHp);
  assert.equal(otherLane.y, cellCenter(3, 0).y);
});

test("defenders only fire to the right and ignore enemies that have passed them", () => {
  const game = new TowerDefenseGame(41);
  game.state.resource = 99;
  deploy(game, "role:ranger", 2, 4);
  const ranger = game.state.units[0];
  game.spawnMonster("slime", 2, 0);
  const passedEnemy = game.state.enemies[0];
  passedEnemy.x = ranger.x - 30;
  passedEnemy.speed = 0;
  passedEnemy.attack = 0;
  const hp = passedEnemy.hp;

  for (let i = 0; i < 180; i += 1) game.updateActors(1 / 60);

  assert.equal(passedEnemy.hp, hp);
  assert.equal(ranger.targetId, null);
});

test("ordinary defenders block one monster while the captain blocks three", () => {
  const ordinary = new TowerDefenseGame(5);
  ordinary.state.resource = 99;
  deploy(ordinary, "role:ranger", 1, 4);
  ordinary.spawnMonster("slime", 1, 0);
  ordinary.spawnMonster("slime", 1, 0);
  ordinary.updateActors(0.01);
  assert.ok(ordinary.state.enemies.every((enemy) => enemy.blockedById === null));
  ordinary.state.enemies.forEach((enemy) => {
    enemy.x = ordinary.state.units[0].x + enemy.range + ordinary.state.units[0].radius * 0.45;
  });
  ordinary.updateActors(0.01);
  assert.equal(ordinary.state.enemies.filter((enemy) => enemy.blockedById === ordinary.state.units[0].id).length, 1);
  assert.equal(ordinary.state.units[0].blockCapacity, 1);

  const captain = new TowerDefenseGame(6);
  captain.state.resource = 99;
  deploy(captain, "role:captain", 1, 4);
  captain.spawnMonster("slime", 1, 0);
  captain.spawnMonster("slime", 1, 0);
  captain.spawnMonster("slime", 1, 0);
  captain.state.enemies.forEach((enemy) => {
    enemy.x = captain.state.units[0].x + enemy.range + captain.state.units[0].radius * 0.45;
  });
  captain.updateActors(0.01);
  assert.equal(captain.state.enemies.filter((enemy) => enemy.blockedById === captain.state.units[0].id).length, 3);
  assert.equal(captain.state.units[0].blockCapacity, 3);
});

test("a ranged monster attacks without reserving the physical block slot", () => {
  const game = new TowerDefenseGame(61);
  game.state.resource = 99;
  deploy(game, "role:golem", 2, 4);
  const guard = game.state.units[0];
  game.spawnMonster("mushroom", 2, 0);
  game.spawnMonster("slime", 2, 0);
  const [mushroom, slime] = game.state.enemies;
  mushroom.x = guard.x + mushroom.range + guard.radius * 0.45;
  slime.x = guard.x + slime.range + guard.radius * 0.45;

  game.updateActors(0.01);

  assert.equal(mushroom.targetId, guard.id);
  assert.equal(mushroom.blockedById, null);
  assert.equal(slime.blockedById, guard.id);
});

test("melee monsters advance on one lane, while ranged monsters stop and fire from range", () => {
  const meleeGame = new TowerDefenseGame(7);
  meleeGame.state.resource = 99;
  deploy(meleeGame, "role:captain", 0, 4);
  const guard = meleeGame.state.units[0];
  meleeGame.startWave(0);
  meleeGame.state.wave.nextSpawnIndex = 999;
  meleeGame.spawnMonster("slime", 0, 0);
  const slime = meleeGame.state.enemies[0];
  advance(meleeGame, 9);
  assert.equal(slime.y, cellCenter(0, 0).y);
  assert.ok(slime.x > guard.x);
  assert.ok(guard.hp < guard.maxHp);

  const rangedGame = new TowerDefenseGame(8);
  rangedGame.state.resource = 99;
  deploy(rangedGame, "role:captain", 4, 4);
  const rangedGuard = rangedGame.state.units[0];
  rangedGame.startWave(0);
  rangedGame.state.wave.nextSpawnIndex = 999;
  rangedGame.spawnMonster("mushroom", 4, 0);
  const mushroom = rangedGame.state.enemies[0];
  advance(rangedGame, 4.5);
  assert.ok(rangedGuard.hp < rangedGuard.maxHp);
  assert.ok(mushroom.x - rangedGuard.x >= MONSTER_DEFS.mushroom.range - 2);
});

test("enemy attack damage grows without a cap after the wave duration", () => {
  const game = new TowerDefenseGame(81);
  game.state.resource = 99;
  deploy(game, "role:captain", 2, 4);
  const guard = game.state.units[0];
  game.spawnMonster("slime", 2, 0);
  const slime = game.state.enemies[0];

  game.state.wave.elapsed = WAVE_DURATION;
  guard.hp = guard.maxHp;
  game.performAttack(slime, guard);
  const baseDamage = guard.maxHp - guard.hp;

  game.state.wave.elapsed = WAVE_DURATION + 40;
  guard.hp = guard.maxHp;
  game.performAttack(slime, guard);
  const overtimeDamage = guard.maxHp - guard.hp;

  game.state.wave.elapsed = WAVE_DURATION + 200;
  guard.hp = guard.maxHp;
  game.performAttack(slime, guard);
  const laterDamage = guard.maxHp - guard.hp;

  assert.ok(overtimeDamage > baseDamage * 2.9);
  assert.ok(laterDamage > overtimeDamage);
});

test("friendly splash and chain damage ignore enemies left of the attacker", () => {
  const splashGame = new TowerDefenseGame(82);
  splashGame.state.resource = 99;
  deploy(splashGame, "role:alchemist", 2, 4);
  const alchemist = splashGame.state.units[0];
  splashGame.spawnMonster("slime", 2, 0);
  splashGame.spawnMonster("slime", 2, 0);
  splashGame.spawnMonster("slime", 2, 0);
  const [primary, passed, forward] = splashGame.state.enemies;
  primary.x = alchemist.x + 20;
  passed.x = alchemist.x - 20;
  forward.x = alchemist.x + 50;
  const passedHp = passed.hp;
  const forwardHp = forward.hp;
  splashGame.performAttack(alchemist, primary);
  assert.equal(passed.hp, passedHp);
  assert.ok(forward.hp < forwardHp);

  const chainGame = new TowerDefenseGame(83);
  chainGame.state.resource = 99;
  deploy(chainGame, "role:ranger", 2, 4);
  const ranger = chainGame.state.units[0];
  addEnergy(chainGame, "energy:fire", ranger);
  addEnergy(chainGame, "energy:lightning", ranger);
  chainGame.spawnMonster("slime", 2, 0);
  chainGame.spawnMonster("slime", 2, 0);
  const [chainPrimary, chainPassed] = chainGame.state.enemies;
  chainPrimary.x = ranger.x + 40;
  chainPassed.x = ranger.x - 30;
  const chainPassedHp = chainPassed.hp;
  chainGame.performAttack(ranger, chainPrimary);
  assert.equal(chainPassed.hp, chainPassedHp);
});

test("two-energy evolution remains order independent and rejects a third energy", () => {
  const evolve = (first, second) => {
    const game = new TowerDefenseGame(9);
    game.state.resource = 99;
    deploy(game, "role:ranger", 0, 0);
    const unit = game.state.units[0];
    game.state.deck.find((slot) => slot.cardId === `energy:${first}`).cooldownLeft = 0;
    addEnergy(game, `energy:${first}`, unit);
    game.state.deck.find((slot) => slot.cardId === `energy:${second}`).cooldownLeft = 0;
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

test("resources regenerate every three seconds and kills pay the monster bounty", () => {
  const game = new TowerDefenseGame(10);
  game.startWave(0);
  game.state.wave.nextSpawnIndex = 0;
  advance(game, 3.05);
  assert.equal(game.state.resource, 21);

  game.state.resource = 30;
  game.state.resourceClock = 0;
  game.spawnMonster("brute", 2, 0);
  const brute = game.state.enemies.at(-1);
  brute.hp = 1;
  const source = { targetId: brute.id };
  game.damage(brute, 10, source);
  game.cleanupActors();
  assert.equal(game.state.resource, 34);
});

test("the ten-point gate takes each monster's configured breach damage", () => {
  const game = new TowerDefenseGame(11);
  game.spawnMonster("brute", 2, 0);
  const brute = game.state.enemies[0];
  brute.x = BOARD.x + 8;
  game.moveEnemyToGate(brute, 0.1);
  assert.equal(game.state.gateHp, 8);

  game.spawnMonster("boss", 2, 5);
  const boss = game.state.enemies.at(-1);
  boss.x = BOARD.x + 8;
  game.moveEnemyToGate(boss, 0.1);
  assert.equal(game.state.gateHp, 3);
});

test("a cleared wave enters a short deployment intermission", () => {
  const game = new TowerDefenseGame(12);
  game.startWave(0);
  game.state.wave.nextSpawnIndex = 999;
  game.state.enemies = [];
  game.checkWaveEnd();
  assert.equal(game.state.phase, "intermission");
  assert.ok(game.state.wave.intermission > 0 && game.state.wave.intermission < 5);

  game.state.resource = 99;
  assert.equal(deploy(game, "role:engineer", 4, 6).type, "deploy");
});

test("schema v2 saves restore tower-defense state and reject old prototype saves", () => {
  const game = new TowerDefenseGame(13);
  game.state.resource = 99;
  deploy(game, "role:captain", 2, 4);
  game.spawnMonster("mushroom", 2, 0);
  const serialized = game.serialize();

  const restored = new TowerDefenseGame();
  assert.equal(restored.restore(serialized), true);
  assert.equal(restored.state.units.length, 1);
  assert.equal(restored.state.units[0].lane, 2);
  assert.equal(restored.state.units[0].cellCol, 4);
  assert.equal(restored.state.units[0].blockCapacity, ROLE_DEFS.captain.block);
  assert.equal(restored.state.enemies[0].lane, 2);

  const old = JSON.parse(serialized);
  old.schemaVersion = 1;
  assert.equal(new TowerDefenseGame().restore(old), false);
});
