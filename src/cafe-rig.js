// Independent PNG layers, hierarchical 2D transforms, no 3D/PBR materials.
export const RIG_ACTIONS = Object.freeze([
  { id: 'idle', label: '待机' }, { id: 'wave', label: '招手' },
  { id: 'walk', label: '行走' }, { id: 'serve', label: '端盘' },
]);
export const EXPRESSION_OPTIONS = Object.freeze([
  { id: 'neutral', label: '自然' }, { id: 'happy', label: '微笑' },
  { id: 'blink', label: '眨眼' }, { id: 'talking', label: '说话' },
]);
export const RIG_PARTS = Object.freeze([
  'torso', 'skirt_apron', 'arm_left_upper', 'arm_right_upper',
  'arm_left_lower', 'arm_right_lower', 'hand_left', 'hand_right',
  'leg_left_upper', 'leg_right_upper', 'leg_left_lower', 'leg_right_lower',
  'shoe_left', 'shoe_right', 'tray', 'cup',
  'face_base', 'hair_back', 'hair_side_left', 'hair_side_right', 'hair_bangs',
  'eyes_open', 'eyes_closed', 'brows_neutral', 'brows_happy',
  'mouth_smile', 'mouth_open', 'mouth_neutral',
]);
export const RIG_BASE_URL = './assets/generated/cafe/coral-v6/parts/';
export const EXPRESSION_LAYERS = Object.freeze({
  neutral: ['eyes_open', 'brows_neutral', 'mouth_neutral'],
  happy: ['eyes_open', 'brows_happy', 'mouth_smile'],
  blink: ['eyes_closed', 'brows_neutral', 'mouth_smile'],
  talking: ['eyes_open', 'brows_neutral', 'mouth_open'],
});

export async function loadRigImages(base = RIG_BASE_URL, createImage = () => new Image()) {
  const pairs = await Promise.all(RIG_PARTS.map((name) => new Promise((resolve, reject) => {
    const image = createImage();
    image.onload = () => resolve([name, image]);
    image.onerror = () => reject(new Error(`无法加载部件：${name}`));
    image.src = base.replace(/\/?$/, '/') + name + '.png';
  })));
  return new Map(pairs);
}

const turn = (p, q, angle) => ({
  x: p.x + q.x * Math.cos(angle) - q.y * Math.sin(angle),
  y: p.y + q.x * Math.sin(angle) + q.y * Math.cos(angle),
});
const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
export function rigPose(action = 'idle', time = 0, expression = 'happy') {
  time = finite(time, 0);
  if (!RIG_ACTIONS.some((item) => item.id === action)) action = 'idle';
  if (!Object.hasOwn(EXPRESSION_LAYERS, expression)) expression = 'happy';
  const walk = action === 'walk', wave = action === 'wave', serve = action === 'serve';
  const cycle = time * (walk ? 5.8 : 2.1), swing = Math.sin(cycle);
  const automaticBlink = !['blink', 'talking'].includes(expression) && time % 4.3 > 4.08;
  const [eyes, brows, mouth] = EXPRESSION_LAYERS[expression];
  return {
    action, expression, bob: walk ? Math.cos(cycle * 2) * 1.8 : swing * 0.8,
    rootAngle: walk ? swing * 0.012 : Math.sin(cycle * 0.5) * 0.007,
    headAngle: Math.sin(cycle * 0.6) * 0.018,
    hairAngle: Math.sin(cycle * 0.85 + 0.9) * (walk ? 0.065 : 0.023),
    eyes: automaticBlink ? 'eyes_closed' : eyes, brows,
    mouth: expression === 'talking' && Math.sin(time * 8) < 0 ? 'mouth_smile' : mouth,
    leftArm: serve ? [-0.12, -1.3, 0.85] : [0.08 + (walk ? swing * 0.24 : 0), -0.04, 0],
    rightArm: wave ? [-1.14, -1.6 + Math.sin(time * 6) * 0.18, 0.22 * Math.sin(time * 6)]
      : serve ? [0.12, 1.3, -0.85] : [-0.08 - (walk ? swing * 0.24 : 0), 0.04, 0],
    leftLeg: walk ? [swing * 0.18, Math.max(0, -swing) * 0.29, -Math.max(0, -swing) * 0.14] : [0.018, -0.018, 0],
    rightLeg: walk ? [-swing * 0.18, -Math.max(0, swing) * 0.29, Math.max(0, swing) * 0.14] : [-0.018, 0.018, 0],
  };
}

export class CafeRig {
  constructor(images) {
    this.images = images;
    this.lastPose = null;
  }
  image(ctx, name, x, y, width, height) {
    const image = this.images.get(name);
    if (!image) return;
    ctx.drawImage(image, x, y, width, height);
  }
  // Each child is transformed in its parent's frame. No whole-limb rotation shortcuts.
  arm(ctx, side, angles, joints) {
    const x = side === 'left' ? -37 : 37, shoulder = { x, y: 24 };
    const elbow = turn(shoulder, { x: 0, y: 47 }, angles[0]);
    const wrist = turn(elbow, { x: 0, y: 43 }, angles[0] + angles[1]);
    joints.push({ name: `${side}_shoulder`, ...shoulder }, { name: `${side}_elbow`, ...elbow }, { name: `${side}_wrist`, ...wrist });
    ctx.save(); ctx.translate(x, 24); ctx.rotate(angles[0]);
    this.image(ctx, `arm_${side}_upper`, -13, -8, 27, 61);
    ctx.translate(0, 47); ctx.rotate(angles[1]);
    this.image(ctx, `arm_${side}_lower`, -9, -6, 18, 51);
    ctx.translate(0, 43); ctx.rotate(angles[2]);
    this.image(ctx, `hand_${side}`, -7.5, -3, 15, 27);
    ctx.restore();
  }
  leg(ctx, side, angles, joints) {
    const x = side === 'left' ? -18 : 18, hip = { x, y: 140 };
    const knee = turn(hip, { x: 0, y: 64 }, angles[0]);
    const ankle = turn(knee, { x: 0, y: 61 }, angles[0] + angles[1]);
    joints.push({ name: `${side}_hip`, ...hip }, { name: `${side}_knee`, ...knee }, { name: `${side}_ankle`, ...ankle });
    ctx.save(); ctx.translate(x, 140); ctx.rotate(angles[0]);
    ctx.save();
    ctx.translate(0, 64); ctx.rotate(angles[1]);
    ctx.save();
    ctx.translate(0, 61); ctx.rotate(angles[2]);
    this.image(ctx, `shoe_${side}`, -15, -7, 30, 43);
    ctx.restore();
    // Draw proximal pieces last so they cover distal attachment caps.
    this.image(ctx, `leg_${side}_lower`, -12, -6, 25, 73);
    ctx.restore();
    this.image(ctx, `leg_${side}_upper`, -17, -7, 34, 78);
    ctx.restore();
  }
  head(ctx, pose) {
    ctx.save(); ctx.translate(0, 3); ctx.rotate(pose.headAngle);
    ctx.save(); ctx.translate(0, -56); ctx.rotate(pose.hairAngle * 0.4);
    this.image(ctx, 'hair_back', -35, -11, 70, 73); ctx.restore();
    this.image(ctx, 'face_base', -26, -65, 52, 71);
    const closed = pose.eyes === 'eyes_closed';
    this.image(ctx, pose.eyes, -21, closed ? -30 : -35, 42, closed ? 5 : 11.5);
    this.image(ctx, pose.brows, -19.5, -42, 39, pose.brows === 'brows_happy' ? 5.4 : 3.8);
    const talking = pose.mouth === 'mouth_open';
    this.image(ctx, pose.mouth, -7, -14, 14, talking ? 8 : pose.mouth === 'mouth_smile' ? 4 : 2.4);
    ctx.save(); ctx.translate(-20, -62); ctx.rotate(pose.hairAngle);
    this.image(ctx, 'hair_side_left', -15, -5, 28, 74); ctx.restore();
    ctx.save(); ctx.translate(20, -62); ctx.rotate(-pose.hairAngle * 0.8);
    this.image(ctx, 'hair_side_right', -12, -5, 32, 74); ctx.restore();
    ctx.save(); ctx.translate(0, -67); ctx.rotate(pose.hairAngle * 0.18);
    this.image(ctx, 'hair_bangs', -32, 0, 64, 61); ctx.restore();
    ctx.restore();
  }
  exploded(ctx) {
    const captions = ['上身', '裙装', '左上臂', '右上臂', '左前臂', '右前臂', '左手', '右手', '左大腿', '右大腿', '左小腿', '右小腿', '左鞋', '右鞋', '托盘', '杯子', '脸底', '后发', '左侧发', '右侧发', '刘海', '睁眼', '闭眼', '眉毛', '笑眉', '微笑', '说话', '嘴巴'];
    RIG_PARTS.forEach((part, index) => {
      const x = (index % 7 - 3) * 61, y = Math.floor(index / 7) * 79 - 58;
      const image = this.images.get(part);
      if (!image) return;
      const scale = Math.min(48 / image.width, 53 / image.height);
      this.image(ctx, part, x - image.width * scale / 2, y, image.width * scale, image.height * scale);
      ctx.fillStyle = '#806d75'; ctx.textAlign = 'center'; ctx.font = '9px sans-serif'; ctx.fillText(captions[index], x, y + 67);
    });
  }
  draw(ctx, { time = 0, action = 'idle', expression = 'happy', x = 0, y = 0, scale = 1, debug = false, explode = 0 } = {}) {
    const pose = rigPose(action, time, expression), joints = [];
    ctx.save(); ctx.translate(finite(x, 0), finite(y, 0));
    const size = Math.max(0.01, finite(scale, 1)); ctx.scale(size, size);
    if (explode) {
      this.exploded(ctx); ctx.restore();
      this.lastPose = { ...pose, joints, partCount: RIG_PARTS.length }; return this.lastPose;
    }
    ctx.translate(0, pose.bob); ctx.rotate(pose.rootAngle);
    this.leg(ctx, 'left', pose.leftLeg, joints); this.leg(ctx, 'right', pose.rightLeg, joints);
    this.arm(ctx, 'left', pose.leftArm, joints);
    this.arm(ctx, 'right', pose.rightArm, joints);
    this.image(ctx, 'torso', -50, 0, 100, 104);
    this.image(ctx, 'skirt_apron', -58, 95, 116, 75);
    if (pose.action === 'serve') {
      this.image(ctx, 'tray', -51, 79, 102, 37);
      this.image(ctx, 'cup', -17, 59, 32, 28);
    }
    this.head(ctx, pose);
    if (debug) {
      ctx.strokeStyle = '#50b5b1'; ctx.fillStyle = '#fff'; ctx.lineWidth = 1.2;
      for (let i = 0; i < joints.length; i += 3) {
        ctx.beginPath(); ctx.moveTo(joints[i].x, joints[i].y);
        ctx.lineTo(joints[i + 1].x, joints[i + 1].y); ctx.lineTo(joints[i + 2].x, joints[i + 2].y); ctx.stroke();
      }
      for (const point of joints) {
        ctx.beginPath(); ctx.arc(point.x, point.y, 2.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore(); this.lastPose = { ...pose, joints, partCount: RIG_PARTS.length }; return this.lastPose;
  }
}
