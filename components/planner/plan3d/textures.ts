import * as THREE from "three";
import type { ArchitectureStyle } from "@/lib/planner/types";

/** Metres per inch — the planner stores inches, the scene works in metres. */
export const IN = 0.0254;

export interface TileSpec {
  /** Tiles drawn into one texture tile, and each tile's real size in metres. */
  cols: number;
  rows: number;
  tileW: number;
  tileH: number;
  base: string[];
  grout: string;
  groutPx: number;
  roughness: number;
  finish: "plain" | "marble" | "terrazzo" | "encaustic" | "microcement";
  vein?: string;
  accents?: string[];
}

export interface StyleKit {
  floor: TileSpec;
  wall: TileSpec;
  /** The wet wall behind the shower. */
  feature: TileSpec;
  counter: TileSpec;
  wood: string;
  metal: { color: string; roughness: number; metalness: number };
  ceramic: string;
  /** Concealed-cistern and panel finish. */
  panel: string;
  /** Bare masonry before prep, and plastered after. */
  masonry: string;
  plaster: string;
  light: string;
}

/**
 * The homeowner's finish picks (from the studio's Visualize step), overriding
 * the architecture kit's colours so the 3D preview reflects THEIR choices, not
 * just the base style. Every field is optional — an unset surface keeps the kit.
 */
export interface ScenePalette {
  floor?: string;
  wall?: string;
  feature?: string;
  wood?: string;
  metal?: string;
  ceramic?: string;
  light?: string;
}

/** Recolour a style kit with the user's finish picks. Keeps tile format and
 *  roughness; swaps the surface colour to the chosen finish. */
export function mergeKit(kit: StyleKit, p?: ScenePalette): StyleKit {
  if (!p) return kit;
  const recolour = (tile: TileSpec, c?: string): TileSpec =>
    c ? { ...tile, base: [c], accents: undefined, vein: undefined } : tile;
  return {
    ...kit,
    floor: recolour(kit.floor, p.floor),
    wall: recolour(kit.wall, p.wall),
    feature: recolour(kit.feature, p.feature),
    wood: p.wood ?? kit.wood,
    metal: p.metal ? { ...kit.metal, color: p.metal } : kit.metal,
    ceramic: p.ceramic ?? kit.ceramic,
    light: p.light ?? kit.light,
  };
}

/**
 * One material kit per architecture style. Tile sizes are the real formats a
 * showroom would offer for that look; colours are chosen to read as the style
 * under the scene's neutral studio light, not sampled from any one product.
 */
export const STYLE_KITS: Record<ArchitectureStyle, StyleKit> = {
  modern: {
    floor: { cols: 2, rows: 2, tileW: 0.6, tileH: 0.6, base: ["#7b7e82", "#818488", "#76797d"], grout: "#5c5f63", groutPx: 3, roughness: 0.55, finish: "microcement" },
    wall: { cols: 2, rows: 4, tileW: 0.6, tileH: 0.3, base: ["#e3e0db", "#dedbd5", "#e6e3de"], grout: "#c6c2bb", groutPx: 3, roughness: 0.42, finish: "plain" },
    feature: { cols: 2, rows: 2, tileW: 0.6, tileH: 1.2, base: ["#3b3e42", "#404347"], grout: "#2c2f32", groutPx: 3, roughness: 0.3, finish: "marble", vein: "#8a8e94" },
    counter: { cols: 1, rows: 1, tileW: 1.2, tileH: 0.6, base: ["#2b2d30"], grout: "#2b2d30", groutPx: 0, roughness: 0.28, finish: "marble", vein: "#6f737a" },
    wood: "#5a4231",
    metal: { color: "#d8dcdf", roughness: 0.16, metalness: 1 },
    ceramic: "#f6f6f4",
    panel: "#e9e7e3",
    masonry: "#a39e95",
    plaster: "#d9d4ca",
    light: "#fff0db",
  },
  traditional: {
    floor: { cols: 4, rows: 4, tileW: 0.2, tileH: 0.2, base: ["#eadcc2", "#e6d7bb"], grout: "#cbbd9f", groutPx: 3, roughness: 0.6, finish: "encaustic", accents: ["#2f5d62", "#b5653b"] },
    wall: { cols: 4, rows: 8, tileW: 0.15, tileH: 0.075, base: ["#f2e9d8", "#efe5d0", "#f4ecdd"], grout: "#d9cdb5", groutPx: 3, roughness: 0.25, finish: "plain" },
    feature: { cols: 4, rows: 8, tileW: 0.15, tileH: 0.075, base: ["#dac7a3", "#d4c09a", "#dfcdab"], grout: "#bfae8b", groutPx: 3, roughness: 0.25, finish: "plain" },
    counter: { cols: 1, rows: 1, tileW: 1.2, tileH: 0.6, base: ["#efe8db"], grout: "#efe8db", groutPx: 0, roughness: 0.3, finish: "marble", vein: "#c2b59c" },
    wood: "#6c3e22",
    metal: { color: "#b98f4f", roughness: 0.3, metalness: 1 },
    ceramic: "#fbf8f0",
    panel: "#efe5d0",
    masonry: "#a89d8c",
    plaster: "#e3d9c7",
    light: "#ffdfb3",
  },
  minimal: {
    floor: { cols: 2, rows: 2, tileW: 0.6, tileH: 0.6, base: ["#e7e5e0", "#e3e1dc"], grout: "#d3d0ca", groutPx: 2, roughness: 0.6, finish: "terrazzo", accents: ["#b9b4ab", "#8f8a82", "#d8cfc2", "#6f6b66"] },
    wall: { cols: 4, rows: 4, tileW: 0.2, tileH: 0.2, base: ["#f4f3ef", "#f1f0ec"], grout: "#e1dfd9", groutPx: 2, roughness: 0.5, finish: "plain" },
    feature: { cols: 1, rows: 1, tileW: 1.2, tileH: 1.2, base: ["#d7d3cb"], grout: "#d7d3cb", groutPx: 0, roughness: 0.7, finish: "microcement" },
    counter: { cols: 1, rows: 1, tileW: 1.2, tileH: 0.6, base: ["#f3f2ee"], grout: "#f3f2ee", groutPx: 0, roughness: 0.45, finish: "plain" },
    wood: "#c7a477",
    metal: { color: "#2a2a2a", roughness: 0.5, metalness: 0.6 },
    ceramic: "#fbfbf9",
    panel: "#f1f0ec",
    masonry: "#a8a49d",
    plaster: "#e5e2dc",
    light: "#fff5e8",
  },
  luxury: {
    floor: { cols: 1, rows: 2, tileW: 0.6, tileH: 1.2, base: ["#ecebe7", "#e8e6e1"], grout: "#d4d1ca", groutPx: 2, roughness: 0.18, finish: "marble", vein: "#9a968e" },
    wall: { cols: 2, rows: 2, tileW: 0.6, tileH: 1.2, base: ["#f1efeb", "#eeece7"], grout: "#dcd8d1", groutPx: 2, roughness: 0.2, finish: "marble", vein: "#b0aba2" },
    feature: { cols: 1, rows: 2, tileW: 0.6, tileH: 1.2, base: ["#1d3831", "#203d35"], grout: "#15291f", groutPx: 2, roughness: 0.16, finish: "marble", vein: "#c9a45c" },
    counter: { cols: 1, rows: 1, tileW: 1.2, tileH: 0.6, base: ["#1a1a1c"], grout: "#1a1a1c", groutPx: 0, roughness: 0.18, finish: "marble", vein: "#7c776f" },
    wood: "#3d291e",
    metal: { color: "#c9a45c", roughness: 0.26, metalness: 1 },
    ceramic: "#fafaf8",
    panel: "#1d3831",
    masonry: "#9f9a91",
    plaster: "#ddd8cf",
    light: "#ffe6c2",
  },
};

/** Deterministic PRNG so a style's tiles look the same on every render. */
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = CanvasRenderingContext2D;

function drawVeins(ctx: Ctx, rnd: () => number, x: number, y: number, w: number, h: number, color: string) {
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  for (let i = 0; i < 7; i++) {
    ctx.globalAlpha = 0.12 + rnd() * 0.38;
    ctx.lineWidth = 0.6 + rnd() * 2.4;
    ctx.shadowBlur = rnd() * 6;
    ctx.beginPath();
    ctx.moveTo(x + rnd() * w, y - 10);
    ctx.bezierCurveTo(
      x + rnd() * w, y + h * 0.3,
      x + rnd() * w, y + h * 0.7,
      x + rnd() * w, y + h + 10,
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawTerrazzo(ctx: Ctx, rnd: () => number, x: number, y: number, w: number, h: number, colors: string[]) {
  const chips = Math.round((w * h) / 90);
  for (let i = 0; i < chips; i++) {
    ctx.fillStyle = colors[Math.floor(rnd() * colors.length)];
    ctx.globalAlpha = 0.55 + rnd() * 0.4;
    ctx.beginPath();
    ctx.ellipse(x + rnd() * w, y + rnd() * h, 1 + rnd() * 3.5, 1 + rnd() * 2.5, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawEncaustic(ctx: Ctx, x: number, y: number, w: number, h: number, colors: string[]) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) / 2;
  ctx.strokeStyle = colors[0];
  ctx.lineWidth = r * 0.06;
  ctx.strokeRect(x + r * 0.1, y + r * 0.1, w - r * 0.2, h - r * 0.2);
  ctx.fillStyle = colors[0];
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42, r * 0.34, r * 0.16, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = colors[1];
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.22);
  ctx.lineTo(cx + r * 0.22, cy);
  ctx.lineTo(cx, cy + r * 0.22);
  ctx.lineTo(cx - r * 0.22, cy);
  ctx.closePath();
  ctx.fill();
  // Corner quarter-circles meet across tiles to form the secondary motif.
  for (const [qx, qy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
    ctx.beginPath();
    ctx.arc(qx, qy, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMicrocement(ctx: Ctx, rnd: () => number, x: number, y: number, w: number, h: number) {
  for (let i = 0; i < 40; i++) {
    const px = x + rnd() * w;
    const py = y + rnd() * h;
    const rr = 20 + rnd() * 90;
    const g = ctx.createRadialGradient(px, py, 0, px, py, rr);
    const light = rnd() > 0.5;
    g.addColorStop(0, light ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }
}

/** A repeating tile texture for one spec, drawn on a canvas. */
export function makeTileTexture(spec: TileSpec, seed: number, anisotropy: number): THREE.CanvasTexture {
  const worldW = spec.cols * spec.tileW;
  const worldH = spec.rows * spec.tileH;
  const W = 1024;
  const H = Math.max(256, Math.min(2048, Math.round((W * worldH) / worldW)));
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  const rnd = mulberry32(seed);

  const tw = W / spec.cols;
  const th = H / spec.rows;
  const g = spec.groutPx;
  ctx.fillStyle = spec.grout;
  ctx.fillRect(0, 0, W, H);

  for (let r = 0; r < spec.rows; r++) {
    for (let c = 0; c < spec.cols; c++) {
      const x = c * tw + g / 2;
      const y = r * th + g / 2;
      const w = tw - g;
      const h = th - g;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.fillStyle = spec.base[Math.floor(rnd() * spec.base.length)];
      ctx.fillRect(x, y, w, h);
      // A soft tonal drift so no two tiles read as identical prints.
      const sheen = ctx.createLinearGradient(x, y, x + w, y + h);
      sheen.addColorStop(0, `rgba(255,255,255,${0.03 + rnd() * 0.05})`);
      sheen.addColorStop(1, `rgba(0,0,0,${0.02 + rnd() * 0.05})`);
      ctx.fillStyle = sheen;
      ctx.fillRect(x, y, w, h);
      if (spec.finish === "marble") drawVeins(ctx, rnd, x, y, w, h, spec.vein ?? "#999999");
      if (spec.finish === "terrazzo") drawTerrazzo(ctx, rnd, x, y, w, h, spec.accents ?? ["#999999"]);
      if (spec.finish === "encaustic") drawEncaustic(ctx, x, y, w, h, spec.accents ?? ["#335566", "#aa6644"]);
      if (spec.finish === "microcement") drawMicrocement(ctx, rnd, x, y, w, h);
      ctx.restore();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = anisotropy;
  return tex;
}

/** A copy of `base` tiled over a surface of `w` × `h` metres, starting at (u0, v0). */
export function tiledFor(base: THREE.Texture, spec: TileSpec, w: number, h: number, u0 = 0, v0 = 0): THREE.Texture {
  const t = base.clone();
  const unitW = spec.cols * spec.tileW;
  const unitH = spec.rows * spec.tileH;
  t.repeat.set(w / unitW, h / unitH);
  t.offset.set(u0 / unitW, v0 / unitH);
  t.needsUpdate = true;
  return t;
}
