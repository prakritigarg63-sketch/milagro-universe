/**
 * The Milagro Universe icon.
 *
 * ORIGIN — read this before changing anything here.
 * This mark is NOT part of the supplied brand artwork. The supplied logo is a
 * wordmark alone; this icon was authored to match a storyboard, at the explicit
 * request of the project owner and over the storyboard brief's own instruction
 * not to invent one. Treat it as this repo's artwork, not as a vendored asset:
 * if an official icon ever arrives, this file is what it replaces.
 *
 * Built as line art on purpose. Every element is a stroked path with a known
 * length, so the reveal can draw each one with stroke-dashoffset instead of
 * fading a raster up — the same technique the wordmark's contours use.
 *
 * Colours are the wordmark's own measured inks, not the storyboard's navy, so
 * the icon and the type are the same two colours rather than nearly the same.
 */

export const ICON_BOX = 120;

export const ICON_INK = {
  slate: "#4c596b",
  cyan: "#019bbf",
} as const;

export const ICON_STROKE = 3;

/** A rounded rectangle as an explicit path, so it can be dash-animated. */
function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  return [
    `M${x + r} ${y}`,
    `H${x + w - r}`,
    `A${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V${y + h - r}`,
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H${x + r}`,
    `A${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V${y + r}`,
    `A${r} ${r} 0 0 1 ${x + r} ${y}`,
    "Z",
  ].join("");
}

export type IconPart = {
  id: string;
  /** Which ink, so both themes can recolour from one place. */
  ink: keyof typeof ICON_INK;
  d: string;
  /** Drawing order: the frames first, then what sits inside them. */
  order: number;
};

/**
 * Two offset frames, a diagonal, a droplet and a faucet.
 *
 * Traced from the supplied six-frame reference, which is the source of truth
 * for this mark. An earlier cut of this file dropped the diagonal and the
 * faucet — the diagonal because a corner-to-corner slash can read as a
 * prohibition sign, the faucet because it muddied at navbar size. The reference
 * settles both: they are part of the icon, so they are here.
 *
 * Those concerns did not evaporate, they moved. The mark now carries five
 * elements, which is more than 44px can hold, so placements were sized up
 * instead — see the size note in MilagroLogo. If it ever has to live small
 * again, the answer is a separate reduced mark, not quietly deleting parts of
 * this one.
 *
 * GEOMETRY NOTES
 * The frames overlap across x 26–96, y 30–84. The droplet and the faucet both
 * sit strictly inside that window: a previous version let them straddle it and
 * a frame edge ran straight down through each, which reads as a scribble at
 * small sizes. The diagonal is the one element that deliberately crosses
 * everything, exactly as the reference draws it.
 *
 * Ids match the group names in the animation so the two stay legible together.
 */
/**
 * The frames' boxes, kept as numbers as well as paths.
 *
 * The blueprint stage needs to run each frame's edges past its corners, and
 * recovering a box by parsing its own path data is the kind of cleverness that
 * breaks the first time the path is edited.
 */
export const ICON_FRAMES = [
  { id: "outer-frame-primary", x: 8, y: 10, w: 88, h: 86 },
  { id: "outer-frame-secondary", x: 20, y: 20, w: 88, h: 86 },
] as const;

export const ICON_PARTS: readonly IconPart[] = [
  { id: "outer-frame-primary", ink: "slate", order: 0, d: roundedRect(8, 10, 88, 86, 10) },
  { id: "outer-frame-secondary", ink: "cyan", order: 1, d: roundedRect(20, 20, 88, 86, 10) },

  /* Drawn before the drop and the tap so they sit over it, as the reference
     does. It crosses the drop deliberately — that is how the mark is built. */
  { id: "diagonal-line", ink: "slate", order: 2, d: "M24 88L80 22" },

  {
    id: "water-drop",
    ink: "slate",
    // Tip at y 38, bowl centred (48, 66) r 15. Sits at x 33–63.
    order: 3,
    d: "M48 38C56 50 63 58 63 66A15 15 0 1 1 33 66C33 58 40 50 48 38Z",
  },

  /* The tap, as a gooseneck rising and turning over, then the outlet run
     reaching back towards the drop. Split so the reveal can stagger them. */
  { id: "faucet", ink: "cyan", order: 4, d: "M76 58V50Q76 42 84 42H86Q94 42 94 50V62" },
  { id: "plumbing-line", ink: "cyan", order: 5, d: "M94 62V66Q94 72 88 72H70Q66 72 66 76V80" },
];

/**
 * The lockup: icon, a gap, then the wordmark scaled to the icon's height.
 *
 * Both live in one SVG rather than two elements in a flex row, so the gap and
 * the relative sizes are fixed by the viewBox and hold at every rendered size.
 * A CSS gap would be a fixed number of pixels and would drift as the mark
 * scales.
 */
export const WORDMARK_BOX = { width: 657, height: 268 } as const;

/** Optical gap between mark and type, in icon units. */
export const LOCKUP_GAP = 26;

/** Wordmark scaled so its height matches the icon's box. */
export const WORDMARK_SCALE = ICON_BOX / WORDMARK_BOX.height;

export const LOCKUP = {
  width: ICON_BOX + LOCKUP_GAP + WORDMARK_BOX.width * WORDMARK_SCALE,
  height: ICON_BOX,
  /** Where the wordmark group starts. */
  wordmarkX: ICON_BOX + LOCKUP_GAP,
} as const;
