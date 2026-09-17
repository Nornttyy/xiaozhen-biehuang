import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CafeRig, RIG_PARTS, rigPose, loadRigImages, EXPRESSION_LAYERS } from '../src/cafe-rig.js';

test('28 independent layer PNGs exist with alpha; hands, shoes and face features have separate files', async () => {
  assert.equal(RIG_PARTS.length, 28);
  assert.equal(new Set(RIG_PARTS).size, 28);
  for (const name of RIG_PARTS) {
    const bytes = await readFile(new URL(`../assets/generated/cafe/coral-v6/parts/${name}.png`, import.meta.url));
    assert.equal(bytes.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.ok(bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0, name);
    assert.equal(bytes[25], 6, `${name} must remain RGBA`);
  }
  for (const name of ['hand_left', 'hand_right', 'shoe_left', 'shoe_right', 'face_base', 'hair_bangs', 'eyes_closed', 'brows_happy', 'mouth_open']) assert.ok(RIG_PARTS.includes(name));
});

test('loader requests 28 real independent paths and rejects a missing asset', async () => {
  const requested = [];
  const images = await loadRigImages('assets/parts', () => ({ set src(value) { requested.push(value); queueMicrotask(() => this.onload()); } }));
  assert.equal(images.size, 28);
  assert.equal(requested[0], 'assets/parts/torso.png');
  assert.equal(requested[27], 'assets/parts/mouth_neutral.png');
  await assert.rejects(loadRigImages('bad/', () => ({ set src(_) { queueMicrotask(() => this.onerror()); } })), /无法加载部件/);
});

test('expressions switch eyes, brows and mouth without replacing the face or hair', () => {
  assert.deepEqual(EXPRESSION_LAYERS.blink, ['eyes_closed', 'brows_neutral', 'mouth_smile']);
  assert.equal(rigPose('idle', 0, 'happy').mouth, 'mouth_smile');
  assert.equal(rigPose('idle', 0, 'neutral').mouth, 'mouth_neutral');
  assert.equal(rigPose('idle', 0, 'blink').eyes, 'eyes_closed');
  assert.equal(rigPose('idle', 0.1, 'talking').mouth, 'mouth_open');
  assert.equal(rigPose('idle', 0.5, 'talking').mouth, 'mouth_smile');
  assert.equal(rigPose('idle', 4.15, 'happy').eyes, 'eyes_closed');
  assert.equal(rigPose('idle', 0, 'constructor').expression, 'happy');
});

function fixture() {
  const draws = [];
  const context = new Proxy({ drawImage: (img) => draws.push(img.name) }, { get: (target, key) => key in target ? target[key] : () => {} });
  const images = new Map(RIG_PARTS.map((name) => [name, { name, width: 100, height: 150 }]));
  return { draws, context, rig: new CafeRig(images) };
}

test('draw uses independent three-segment limbs and four independently moving hair layers', () => {
  const { draws, context, rig } = fixture();
  const pose = rig.draw(context, { action: 'wave', time: 0.5, debug: true });
  for (const name of ['arm_right_upper', 'arm_right_lower', 'hand_right', 'leg_left_upper', 'leg_left_lower', 'shoe_left', 'face_base', 'hair_back', 'hair_side_left', 'hair_side_right', 'hair_bangs']) assert.ok(draws.includes(name), name);
  assert.equal(pose.joints.length, 12);
  assert.equal(draws.filter((name) => name.startsWith('eyes_')).length, 1);
  assert.equal(draws.filter((name) => name.startsWith('mouth_')).length, 1);
  assert.ok(draws.indexOf('leg_left_upper') > draws.indexOf('leg_left_lower'), 'thigh covers knee cap');
  assert.ok(draws.indexOf('leg_left_lower') > draws.indexOf('shoe_left'), 'calf covers shoe ankle cap');
});

test('child elbow/wrist and knee/ankle distances remain connected across actions', () => {
  const { context, rig } = fixture();
  for (const action of ['idle', 'wave', 'walk', 'serve']) for (const time of [0, 0.4, 0.8, 1.2, 2.1]) {
    const { joints } = rig.draw(context, { action, time });
    const p = Object.fromEntries(joints.map((joint) => [joint.name, joint]));
    for (const side of ['left', 'right']) for (const [start, end, length] of [['shoulder', 'elbow', 47], ['elbow', 'wrist', 43], ['hip', 'knee', 64], ['knee', 'ankle', 61]]) {
      const a = p[`${side}_${start}`], b = p[`${side}_${end}`];
      assert.ok(Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - length) < 1e-8);
    }
  }
});

test('exploded view shows all 28 files; action and time inputs are guarded', () => {
  const { draws, context, rig } = fixture();
  rig.draw(context, { explode: 1 });
  assert.deepEqual(draws, RIG_PARTS);
  const p = rigPose('bad', NaN, 'bad');
  assert.equal(p.action, 'idle'); assert.ok(Number.isFinite(p.bob));
  assert.notDeepEqual(rigPose('walk', 0.2).leftLeg, rigPose('walk', 0.7).leftLeg);
  assert.notDeepEqual(rigPose('wave', 0.2).rightArm, rigPose('wave', 0.7).rightArm);
});
