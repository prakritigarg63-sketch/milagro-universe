/**
 * Slices the supplied Milagro Universe logo PNG into disjoint, pixel-exact layers.
 *
 * Why: the animation draws the mark element-by-element, but the only asset we
 * have is a flat raster. Every non-white pixel is assigned to exactly one layer
 * and keeps its original RGB, so stacking all layers over white reproduces the
 * supplied logo byte-for-byte. No pixel is invented or recoloured.
 *
 * Run: node scripts/gen-logo-layers.js [path-to-source.png]
 */
const path = require("path");
const sharp = require("sharp");

const SRC = process.argv[2] || "C:/Users/admin/Downloads/milagro_logo.png";
const OUT = path.join(__dirname, "..", "public", "logo");

// Measured from the source raster (see docs/logo-geometry.md).
const LOGO = { x: 89, y: 376, w: 846, h: 272 };
const ICON = { w: 297, h: 272 };
// The wordmark halves are cut at the blank column between "Bath" and "Craft"
// (local x 569-578) and run full height to the canvas edges. Icon + bath +
// craft therefore tile the lockup exactly, with no seam that could drop a
// faint antialiased pixel from the resting frame.
const WORD = { split: 574 };

// Stroke centrelines of the two blueprint frames, in icon-local coordinates.
const SLATE_FRAME = { x0: 7, y0: 7, x1: 259, y1: 265, r: 13 };
const BLUE_FRAME = { x0: 37, y0: 36, x1: 289, y1: 235, r: 15 };
const HALF_STROKE = 9.5;

const SLATE = [74, 92, 114];
const INK_THRESHOLD = 255;

/** Distance from a point to a rounded-rectangle outline (unsigned). */
function distToFrame(px, py, f) {
  const cx = (f.x0 + f.x1) / 2;
  const cy = (f.y0 + f.y1) / 2;
  const bx = (f.x1 - f.x0) / 2 - f.r;
  const by = (f.y1 - f.y0) / 2 - f.r;
  const qx = Math.abs(px - cx) - bx;
  const qy = Math.abs(py - cy) - by;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inside = Math.min(Math.max(qx, qy), 0);
  return Math.abs(outside + inside - f.r);
}

/** Blue vs slate, robust to antialiasing against white. */
function isBlue(r, g, b) {
  const ink = 255 - Math.min(r, g, b);
  if (ink <= 0) return false;
  return (b - r) / ink > 0.45;
}

/** How much ink this pixel carries, 0..1, given its base colour's darkest channel. */
function inkFraction(r, g, b, baseMin) {
  return Math.min(1, (255 - Math.min(r, g, b)) / (255 - baseMin));
}

(async () => {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const C = info.channels;
  const at = (x, y) => {
    const i = ((y + LOGO.y) * W + (x + LOGO.x)) * C;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const layers = {
    "frame-slate": Buffer.alloc(ICON.w * ICON.h * 4, 0),
    "frame-blue": Buffer.alloc(ICON.w * ICON.h * 4, 0),
    faucet: Buffer.alloc(ICON.w * ICON.h * 4, 0),
    drop: Buffer.alloc(ICON.w * ICON.h * 4, 0),
    icon: Buffer.alloc(ICON.w * ICON.h * 4, 0),
  };
  // Slate-tinted twins of the blue layers, for the "blueprint grey -> brand blue" turn.
  const tinted = {
    "frame-blue-slate": Buffer.alloc(ICON.w * ICON.h * 4, 0),
    "faucet-slate": Buffer.alloc(ICON.w * ICON.h * 4, 0),
  };
  const counts = {};

  for (let y = 0; y < ICON.h; y++) {
    for (let x = 0; x < ICON.w; x++) {
      const [r, g, b] = at(x, y);
      if (r >= INK_THRESHOLD && g >= INK_THRESHOLD && b >= INK_THRESHOLD) continue;

      const blue = isBlue(r, g, b);
      let name;
      if (blue) {
        name = distToFrame(x, y, BLUE_FRAME) <= HALF_STROKE ? "frame-blue" : "faucet";
      } else {
        name = distToFrame(x, y, SLATE_FRAME) <= HALF_STROKE ? "frame-slate" : "drop";
      }
      counts[name] = (counts[name] || 0) + 1;

      const o = (y * ICON.w + x) * 4;
      for (const buf of [layers[name], layers.icon]) {
        buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = 255;
      }
      if (blue) {
        const t = inkFraction(r, g, b, 3);
        const twin = tinted[name === "frame-blue" ? "frame-blue-slate" : "faucet-slate"];
        twin[o] = Math.round(255 - t * (255 - SLATE[0]));
        twin[o + 1] = Math.round(255 - t * (255 - SLATE[1]));
        twin[o + 2] = Math.round(255 - t * (255 - SLATE[2]));
        twin[o + 3] = 255;
      }
    }
  }

  const write = (buf, w, h, file) =>
    sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(OUT, file));

  for (const [name, buf] of Object.entries({ ...layers, ...tinted })) {
    await write(buf, ICON.w, ICON.h, `icon-${name}.png`);
  }

  // Wordmark halves, cropped straight out of the source so the typography is untouched.
  const halves = {
    bath: [ICON.w, WORD.split - ICON.w],
    craft: [WORD.split, LOGO.w - WORD.split],
  };
  for (const [name, [x, w]] of Object.entries(halves)) {
    await sharp(SRC)
      .extract({ left: LOGO.x + x, top: LOGO.y, width: w, height: LOGO.h })
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT, `wordmark-${name}.png`));
  }
  console.log("wordmark halves:", JSON.stringify(halves));

  // Whole lockup, used for the reduced-motion fallback and social cards.
  await sharp(SRC).extract({ left: LOGO.x, top: LOGO.y, width: LOGO.w, height: LOGO.h })
    .png({ compressionLevel: 9 }).toFile(path.join(OUT, "logo-full.png"));

  // White-on-transparent lockup, for placing over photography.
  //
  // The supplied logo sits on opaque white, so a CSS `brightness(0) invert(1)`
  // turns the whole rectangle into a white block. Instead, key the white out:
  // alpha comes from how dark each pixel is, and every kept pixel is set to
  // white. Antialiasing survives because alpha is continuous.
  {
    const buf = Buffer.alloc(LOGO.w * LOGO.h * 4);
    for (let y = 0; y < LOGO.h; y++) {
      for (let x = 0; x < LOGO.w; x++) {
        const [r, g, b] = at(x, y);
        const o = (y * LOGO.w + x) * 4;
        buf[o] = 255;
        buf[o + 1] = 255;
        buf[o + 2] = 255;
        buf[o + 3] = 255 - Math.min(r, g, b);
      }
    }
    await sharp(buf, { raw: { width: LOGO.w, height: LOGO.h, channels: 4 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT, "logo-white.png"));
  }

  console.log("pixels per layer:", counts);
  console.log("wrote layers to", OUT);
})();
