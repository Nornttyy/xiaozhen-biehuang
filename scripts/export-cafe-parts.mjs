// Mechanical sprite extraction only. Artwork is generated with image_gen.
// sips preserves the PNG alpha; this does not redraw or recolor any pixels.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetRoot = path.join(root, 'assets/generated/cafe/coral-v6');
export const CROPS = {
  body: {
    torso: [39, 37, 290, 294], skirt_apron: [347, 115, 306, 198],
    arm_left_upper: [708, 56, 144, 271], arm_right_upper: [1029, 56, 144, 271],
    arm_left_lower: [141, 388, 93, 229], arm_right_lower: [446, 388, 93, 229],
    hand_left: [755, 432, 99, 174], hand_right: [1027, 432, 99, 174],
    leg_left_upper: [105, 652, 140, 268], leg_right_upper: [432, 655, 136, 264],
    leg_left_lower: [732, 661, 105, 251], leg_right_lower: [1046, 661, 103, 251],
    shoe_left: [110, 1000, 123, 201], shoe_right: [427, 996, 117, 202],
    tray: [644, 1038, 290, 119], cup: [1031, 1028, 166, 139],
  },
  head: {
    face_base: [34, 113, 253, 346], hair_back: [314, 96, 358, 362],
    hair_side_left: [687, 101, 159, 369], hair_side_right: [1039, 98, 181, 370],
    hair_bangs: [23, 543, 284, 273], eyes_open: [329, 653, 280, 75],
    eyes_closed: [650, 686, 269, 32], brows_neutral: [975, 661, 244, 23],
    brows_happy: [30, 998, 259, 36], mouth_smile: [425, 1034, 88, 24],
    mouth_open: [739, 1022, 92, 53], mouth_neutral: [1058, 1041, 80, 12],
  },
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  mkdirSync(path.join(assetRoot, 'parts'), { recursive: true });
  for (const [sheet, parts] of Object.entries(CROPS)) {
    for (const [name, [x, y, w, h]] of Object.entries(parts)) {
      const source = path.join(assetRoot, `${sheet}-atlas-v6.png`);
      const destination = path.join(assetRoot, 'parts', `${name}.png`);
      execFileSync('sips', ['--cropToHeightWidth', String(h + 6), String(w + 6),
        '--cropOffset', String(y - 3), String(x - 3), source, '--out', destination], { stdio: 'ignore' });
    }
  }
  console.log('Exported 28 independent RGBA PNG parts; source atlases preserved.');
}
