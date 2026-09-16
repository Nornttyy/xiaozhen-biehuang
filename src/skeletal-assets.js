export const RANGER_PARTS = Object.freeze([
  "arm_front_lower",
  "arm_front_upper",
  "arm_rear_lower",
  "arm_rear_upper",
  "arrow_fx",
  "bow",
  "cape",
  "hair_back",
  "hair_front",
  "head",
  "leg_front_lower",
  "leg_front_upper",
  "leg_rear_lower",
  "leg_rear_upper",
  "quiver",
  "torso",
]);

export const SLIME_PARTS = Object.freeze([
  "arm_left",
  "arm_right",
  "body",
  "core",
  "face",
  "horn_left",
  "horn_right",
  "shadow",
]);

function cleanBasePath(path) {
  return String(path || "assets/generated").replace(/\/+$/, "");
}

export class AssetBank {
  constructor(platform, basePath = "assets/generated") {
    this.platform = platform;
    this.basePath = cleanBasePath(basePath);
    this.images = new Map();
    this.failures = new Set();
    this.loading = null;
  }

  entries() {
    return [
      ["background", "battlefield-anime-v2.png"],
      ...RANGER_PARTS.map((part) => [`ranger:${part}`, `ranger/parts/${part}.png`]),
      ...SLIME_PARTS.map((part) => [`slime:${part}`, `slime/parts/${part}.png`]),
    ];
  }

  preload() {
    if (this.loading) return this.loading;
    this.loading = Promise.all(this.entries().map(async ([key, relativePath]) => {
      try {
        const image = await this.platform.loadImage(`${this.basePath}/${relativePath}`);
        if (image) this.images.set(key, image);
        else this.failures.add(key);
      } catch {
        this.failures.add(key);
      }
    })).then(() => this);
    return this.loading;
  }

  get(key) {
    return this.images.get(key) || null;
  }

  part(group, name) {
    return this.get(`${group}:${name}`);
  }

  groupReady(group) {
    const parts = group === "ranger" ? RANGER_PARTS : group === "slime" ? SLIME_PARTS : [];
    return parts.length > 0 && parts.every((part) => this.images.has(`${group}:${part}`));
  }
}
