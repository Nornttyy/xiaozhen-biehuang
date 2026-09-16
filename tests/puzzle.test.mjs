import test from "node:test";
import assert from "node:assert/strict";
import { PuzzleGame, GRID, BUTTONS, LEVEL_COUNT, connected, possibleMoves, tileCenter, levelRect, neighbors } from "../src/puzzle-core.js";

function settle(game) { for (let i = 0; i < 15; i++) game.update(0.1); }
function isolated(game) {
  game.state.board.forEach((tile, i) => { tile.type = (Math.floor(i / GRID.cols) + i % GRID.cols) % 5; tile.special = null; });
}
function group(game, indices, type = 0) {
  isolated(game);
  indices.forEach((i) => { game.state.board[i].type = type; });
  indices.forEach((i) => neighbors(i).forEach((j) => {
    if (!indices.includes(j) && game.state.board[j].type === type) game.state.board[j].type = (type + 1) % 5;
  }));
}
function tap(game, index) { const p = tileCenter(index); return game.handleTap(p.x, p.y); }
function clickButton(game, key) { const r = BUTTONS[key]; return game.handleTap(r.x + r.w / 2, r.y + r.h / 2); }

test("new puzzle has a full playable 7×6 board and ten short levels", () => {
  const game = new PuzzleGame(20260917);
  assert.equal(game.state.mode, "puzzle");
  assert.equal(game.state.board.length, 42);
  assert.equal(new Set(game.state.board.map((t) => t.id)).size, 42);
  assert.equal(game.state.moves, 25);
  assert.equal(LEVEL_COUNT, 10);
  assert.ok(possibleMoves(game.state.board).length > 0);
});

test("group search only joins orthogonal neighbors and never wraps rows", () => {
  const game = new PuzzleGame(2);
  group(game, [6, 7, 14], 4);
  game.state.board[5].type = 0;
  game.state.board[13].type = 1;
  assert.deepEqual(connected(game.state.board, 6), [6]);
  assert.deepEqual(connected(game.state.board, 7).sort((a,b) => a-b), [7, 14]);
});

test("an isolated tile, off-board tap, and rapid repeat never spend a move", () => {
  const game = new PuzzleGame(3);
  isolated(game);
  assert.equal(tap(game, 0), null);
  assert.equal(game.handleTap(-1, -1), null);
  assert.equal(game.state.moves, 25);
  group(game, [0, 1], 0);
  assert.equal(tap(game, 0).type, "clear");
  assert.equal(tap(game, 0), null);
  assert.equal(game.state.moves, 24);
  assert.equal(game.state.movesUsed, 1);
});

test("gravity keeps surviving tile order and refills every cell with unique IDs", () => {
  const game = new PuzzleGame(4);
  const ids = game.state.board.map((t) => t.id);
  game.refill([0, 14, 35]);
  assert.deepEqual([game.state.board[21].id, game.state.board[28].id, game.state.board[35].id], [ids[7], ids[21], ids[28]]);
  assert.equal(game.state.board[1].id, ids[1]);
  assert.equal(new Set(game.state.board.map((t) => t.id)).size, 42);
  assert.ok(game.state.board.every(Boolean));
});

test("4, 5, and 7 tile groups produce a usable row, bomb, and rainbow tile", () => {
  for (const [indices, expected] of [ [[0,1,7,8], "line"], [[0,1,2,7,8], "bomb"], [[0,1,2,7,8,9,14], "rainbow"] ]) {
    const game = new PuzzleGame(5);
    group(game, indices, 0);
    const id = game.state.board[0].id;
    assert.equal(game.clear(0), true);
    assert.equal(game.state.board.find((tile) => tile.id === id)?.special, expected);
    settle(game);
    const index = game.state.board.findIndex((tile) => tile.id === id);
    assert.equal(game.clear(index), true);
    assert.ok(game.state.animation.count >= 3);
  }
});

test("row blasts chain into bombs without wrapping their area beyond board edges", () => {
  const game = new PuzzleGame(6);
  isolated(game);
  game.state.board[0].special = "line";
  game.state.board[6].special = "bomb";
  assert.deepEqual(game.expandSpecials([0]).sort((a,b) => a-b), [0,1,2,3,4,5,6,12,13]);
  assert.equal(game.clear(0), true);
  assert.equal(game.state.animation.count, 9);
});

test("rainbow clears its color across the board and triggers touched specials", () => {
  const game = new PuzzleGame(7);
  isolated(game);
  game.state.board[0].special = "rainbow";
  const expected = game.state.board.map((t,i) => t.type === 0 ? i : -1).filter((i) => i >= 0);
  assert.deepEqual(game.expandSpecials([0]).sort((a,b) => a-b), expected);
});

test("each normal move advances one enemy countdown; idle time advances none", () => {
  const game = new PuzzleGame(8);
  group(game, [0, 1], 4);
  game.foe.countdown = 1;
  const hp = game.state.hp, damage = game.foe.attack;
  game.clear(0);
  assert.equal(game.state.hp, hp - damage);
  assert.equal(game.foe.countdown, game.foe.interval);
  const snapshot = { hp: game.state.hp, moves: game.state.moves, enemy: game.foe.hp, countdown: game.foe.countdown };
  for (let i = 0; i < 1000; i++) game.update(0.1);
  assert.deepEqual({ hp: game.state.hp, moves: game.state.moves, enemy: game.foe.hp, countdown: game.foe.countdown }, snapshot);
});

test("hearts heal within cap and matching elements charge and release heroine skills", () => {
  const healing = new PuzzleGame(9);
  group(healing, [0, 1], 4);
  healing.state.hp = 95;
  healing.clear(0);
  assert.equal(healing.state.hp, 100);
  const skill = new PuzzleGame(10);
  group(skill, [0, 1], 1);
  skill.state.charges[1] = 8;
  const before = skill.foe.countdown;
  skill.clear(0);
  assert.deepEqual(skill.state.animation.skills, [1]);
  assert.equal(skill.state.charges[1], 0);
  assert.equal(skill.foe.countdown, before + 1);
});

test("damage carries to the next enemy and a newly spawned enemy waits its full countdown", () => {
  const game = new PuzzleGame(11);
  group(game, [0, 1], 0);
  game.foe.hp = 1;
  game.clear(0);
  assert.equal(game.state.foeIndex, 1);
  assert.equal(game.foe.hp, game.foe.maxHp - 25);
  assert.equal(game.foe.countdown, game.foe.interval);
});

test("free hammer and shuffle have limited charges and do not spend moves", () => {
  const game = new PuzzleGame(12);
  isolated(game);
  clickButton(game, "hammer");
  assert.equal(game.state.hammerArmed, true);
  assert.equal(tap(game, 0).type, "clear");
  assert.equal(game.state.moves, 25);
  assert.equal(game.state.hammers, 1);
  settle(game);
  assert.equal(game.shuffle(), true);
  settle(game);
  assert.equal(game.shuffle(), true);
  settle(game);
  assert.equal(game.shuffle(), false);
  assert.equal(game.state.moves, 25);
});

test("dead boards recover automatically without consuming a booster", () => {
  const game = new PuzzleGame(13);
  isolated(game);
  assert.equal(possibleMoves(game.state.board).length, 0);
  assert.equal(game.ensurePlayable(), true);
  assert.ok(possibleMoves(game.state.board).length > 0);
  assert.equal(game.state.shuffles, 2);
});

test("pause and the level picker block the board and preserve the suspended phase", () => {
  const game = new PuzzleGame(14);
  clickButton(game, "pause");
  assert.equal(tap(game, 0), null);
  assert.equal(game.state.moves, 25);
  clickButton(game, "levels");
  assert.equal(game.state.phase, "levels");
  const locked = levelRect(1);
  game.handleTap(locked.x + 10, locked.y + 10);
  assert.equal(game.state.level, 1);
  clickButton(game, "close");
  assert.equal(game.state.phase, "paused");
  clickButton(game, "primary");
  assert.equal(game.state.phase, "playing");
});

test("pausing during a fall can resume through the primary button without a deadlock", () => {
  const game = new PuzzleGame(141);
  tap(game, 0);
  assert.ok(game.state.lock > 0);
  clickButton(game, "pause");
  for (let i = 0; i < 20; i++) game.update(0.1);
  assert.equal(game.state.phase, "paused");
  assert.ok(game.state.lock > 0);
  clickButton(game, "primary");
  assert.equal(game.state.phase, "playing");
  settle(game);
  assert.equal(game.state.lock, 0);
});

test("last enemy clear wins on the last move, unlocks a level and persists stars", () => {
  const game = new PuzzleGame(15);
  group(game, [0, 1], 0);
  game.state.foeIndex = 2;
  game.foe.hp = 1;
  game.state.moves = 1;
  game.state.movesUsed = 24;
  game.clear(0);
  assert.equal(game.state.phase, "victory");
  assert.equal(game.state.unlocked, 2);
  assert.ok(game.state.bestStars[0] >= 1);
  settle(game);
  clickButton(game, "primary");
  assert.equal(game.state.level, 2);
  assert.equal(game.state.moves, 25);
  assert.ok(game.state.bestStars[0] >= 1);
});

test("running out of moves or health loses; restart keeps unlocked progress", () => {
  for (const mode of ["moves", "hp"]) {
    const game = new PuzzleGame(16);
    group(game, [0, 1], 0);
    if (mode === "moves") { game.state.moves = 1; game.state.movesUsed = 24; }
    else { game.state.hp = 1; game.foe.countdown = 1; }
    game.clear(0);
    assert.equal(game.state.phase, "defeat");
    assert.equal(tap(game, 0), null);
    settle(game);
    clickButton(game, "primary");
    assert.equal(game.state.phase, "playing");
    assert.equal(game.state.hp, 100);
    assert.equal(game.state.moves, 25);
  }
});

test("save resumes the exact board, progress and RNG, rejecting stale or malformed saves", () => {
  const game = new PuzzleGame(17);
  game.clear(0); settle(game);
  const restored = new PuzzleGame(123);
  assert.equal(restored.restore(game.serialize()), true);
  assert.equal(restored.seed, game.seed);
  assert.deepEqual(restored.state.board.map(({fromRow, ...t}) => t), game.state.board.map(({fromRow, ...t}) => t));
  assert.equal(restored.state.moves, game.state.moves);
  assert.equal(restored.restore('{bad json'), false);
  assert.equal(restored.restore({ schemaVersion: 3 }), false);
  const bad = JSON.parse(game.serialize());
  bad.board[0].type = 50;
  assert.equal(restored.restore(bad), false);
  const badHp = JSON.parse(game.serialize());
  badHp.hp = "full";
  assert.equal(restored.restore(badHp), false);
});

test("a seeded legal largest-match playthrough reaches all ten levels without deadlocks", () => {
  const game = new PuzzleGame(20260917);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    let guard = 0;
    while (game.state.phase === "playing" && guard++ < 26) {
      const moves = possibleMoves(game.state.board);
      assert.ok(moves.length);
      const best = moves.sort((a,b) => game.expandSpecials(b).length - game.expandSpecials(a).length)[0];
      assert.equal(tap(game, best[0])?.type, "clear");
      settle(game);
      assert.equal(new Set(game.state.board.map((t) => t.id)).size, 42);
    }
    assert.equal(game.state.phase, "victory", `level ${level}`);
    assert.equal(game.state.unlocked, Math.min(LEVEL_COUNT, level + 1));
    if (level < LEVEL_COUNT) clickButton(game, "primary");
  }
});
