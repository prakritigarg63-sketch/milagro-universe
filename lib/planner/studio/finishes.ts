import type { FinishSurface, StyleDirection } from "@/lib/planner/types";

/**
 * Finishes the homeowner can try on the visualization.
 *
 * Every option carries the colours the preview actually renders with, so
 * "Warm Travertine" changes what you see rather than only what is written down.
 * These are representative colours for planning, not product swatches matched
 * to a manufacturer's batch — tile colour varies between batches and screens.
 */

export interface FinishOption {
  id: string;
  label: string;
  /** Main colour used for the surface in the preview. */
  color: string;
  /** Secondary colour — grout, veining, or a shadow tone. */
  accent: string;
  /** One line on what the finish is like to live with. */
  note: string;
}

export interface FinishGroup {
  surface: FinishSurface;
  label: string;
  /** Headline shown when the panel opens, e.g. "Try a tile". */
  prompt: string;
  options: FinishOption[];
}

const TILES: FinishOption[] = [
  { id: "warmTravertine", label: "Warm Travertine", color: "#d8c5ac", accent: "#bfa688", note: "Soft warm stone; hides water marks well." },
  { id: "whiteMarble", label: "White Marble", color: "#eef0f0", accent: "#c8d0d4", note: "Bright and classic; shows more dust." },
  { id: "terrazzo", label: "Terrazzo", color: "#e4e0d6", accent: "#a89f92", note: "Speckled; very forgiving day to day." },
  { id: "concrete", label: "Concrete", color: "#c3c5c4", accent: "#9a9d9d", note: "Quiet, modern, pairs with most fittings." },
  { id: "subway", label: "Subway", color: "#f2f4f4", accent: "#d3d9db", note: "Small format; more grout lines to clean." },
  { id: "patterned", label: "Patterned", color: "#dfe6e6", accent: "#5d7c86", note: "A feature in its own right; keep the rest plain." },
];

const WALLS: FinishOption[] = [
  { id: "chalk", label: "Chalk White", color: "#f4f5f5", accent: "#dfe3e4", note: "Maximum light; the safe default." },
  { id: "warmSand", label: "Warm Sand", color: "#e8dfd1", accent: "#cfc2ad", note: "Warms a room with little natural light." },
  { id: "softClay", label: "Soft Clay", color: "#dcc9bb", accent: "#bfa695", note: "Earthy; flatters warm wood and brass." },
  { id: "deepSlate", label: "Deep Slate", color: "#5a6a74", accent: "#42505a", note: "Dramatic; best with strong lighting." },
  { id: "sage", label: "Sage", color: "#c6cfc0", accent: "#a5b19c", note: "Calm and natural; easy with stone." },
];

const VANITY: FinishOption[] = [
  { id: "oak", label: "Natural Oak", color: "#c69a6b", accent: "#a87f52", note: "Warm grain; hides splashes." },
  { id: "walnut", label: "Walnut", color: "#8a5f42", accent: "#6d4a33", note: "Rich and dark; a strong anchor." },
  { id: "matteWhite", label: "Matte White", color: "#eef0f1", accent: "#d2d8da", note: "Disappears into the wall; feels larger." },
  { id: "inkGreen", label: "Ink Green", color: "#3f5850", accent: "#2f423c", note: "A quiet feature colour." },
];

const METAL: FinishOption[] = [
  { id: "chrome", label: "Chrome", color: "#cfd6da", accent: "#9fa9ae", note: "Hard-wearing and easy to find." },
  { id: "brushedNickel", label: "Brushed Nickel", color: "#b9bfc1", accent: "#8d9497", note: "Softer sheen; fingerprints show less." },
  { id: "matteBlack", label: "Matte Black", color: "#2f3335", accent: "#1c1f21", note: "Bold; water spots are more visible." },
  { id: "brass", label: "Brushed Brass", color: "#b08d54", accent: "#8c6d3d", note: "Warm; pairs with wood and stone." },
];

const CERAMIC: FinishOption[] = [
  { id: "gloss", label: "Gloss White", color: "#f7f8f8", accent: "#dde2e4", note: "Standard sanitaryware; easiest to clean." },
  { id: "matteWhiteWare", label: "Matte White", color: "#eceeed", accent: "#cfd4d3", note: "Softer look; needs a gentler cleaner." },
  { id: "stoneGrey", label: "Stone Grey", color: "#b9bdbd", accent: "#989d9d", note: "Understated; less obvious limescale." },
];

const LIGHTING: FinishOption[] = [
  { id: "warm", label: "Warm (2700K)", color: "#ffd9a8", accent: "#e0b276", note: "Relaxing; flatters warm finishes." },
  { id: "neutral", label: "Neutral (3500K)", color: "#fdf3e4", accent: "#dccdb6", note: "Good all-rounder for grooming." },
  { id: "daylight", label: "Daylight (5000K)", color: "#eaf2ff", accent: "#c3d3e8", note: "Truest colour; can feel clinical." },
];

export const FINISH_GROUPS: FinishGroup[] = [
  { surface: "tiles", label: "Tiles", prompt: "Try a tile", options: TILES },
  { surface: "floor", label: "Floor", prompt: "Choose a floor", options: TILES },
  { surface: "walls", label: "Walls", prompt: "Choose a wall finish", options: WALLS },
  { surface: "vanity", label: "Vanity", prompt: "Choose a vanity finish", options: VANITY },
  { surface: "shower", label: "Shower", prompt: "Choose a shower finish", options: METAL },
  { surface: "wc", label: "WC", prompt: "Choose a WC finish", options: CERAMIC },
  { surface: "fittings", label: "Fittings", prompt: "Choose your fittings", options: METAL },
  { surface: "lighting", label: "Lighting", prompt: "Choose your lighting", options: LIGHTING },
];

export function groupFor(surface: FinishSurface): FinishGroup | undefined {
  return FINISH_GROUPS.find((g) => g.surface === surface);
}

export function optionFor(surface: FinishSurface, id: string | undefined): FinishOption | undefined {
  if (!id) return undefined;
  return groupFor(surface)?.options.find((o) => o.id === id);
}

/**
 * The finishes a style direction starts from.
 *
 * Choosing a style should *do* something immediately, so each direction seeds a
 * coherent set. Anything the homeowner has already picked by hand wins — a
 * style is a starting point, not an override.
 */
export const STYLE_PRESETS: Record<StyleDirection, Partial<Record<FinishSurface, string>>> = {
  warmMinimal: { floor: "warmTravertine", walls: "warmSand", vanity: "oak", fittings: "brushedNickel", wc: "matteWhiteWare", lighting: "warm" },
  modernLuxe: { floor: "whiteMarble", walls: "chalk", vanity: "inkGreen", fittings: "brass", wc: "gloss", lighting: "neutral" },
  naturalEarthy: { floor: "terrazzo", walls: "softClay", vanity: "walnut", fittings: "brass", wc: "stoneGrey", lighting: "warm" },
  cleanContemporary: { floor: "concrete", walls: "chalk", vanity: "matteWhite", fittings: "matteBlack", wc: "gloss", lighting: "daylight" },
  classic: { floor: "subway", walls: "sage", vanity: "oak", fittings: "chrome", wc: "gloss", lighting: "neutral" },
};

export interface StyleDirectionCard {
  id: StyleDirection;
  label: string;
  traits: string[];
  photo: string;
}

export const STYLE_CARDS: StyleDirectionCard[] = [
  { id: "warmMinimal", label: "Warm Minimal", traits: ["Soft stone", "Warm wood", "Muted fittings"], photo: "/photos/style-minimal.jpg" },
  { id: "modernLuxe", label: "Modern Luxe", traits: ["Marble", "Statement lighting", "Premium fittings"], photo: "/photos/style-luxury.jpg" },
  { id: "naturalEarthy", label: "Natural & Earthy", traits: ["Natural textures", "Warm neutrals", "Organic finishes"], photo: "/photos/after.jpg" },
  { id: "cleanContemporary", label: "Clean & Contemporary", traits: ["Light surfaces", "Simple geometry", "Minimal fixtures"], photo: "/photos/style-modern.jpg" },
  { id: "classic", label: "Classic", traits: ["Timeless finishes", "Traditional detailing"], photo: "/photos/style-traditional.jpg" },
];

/** The structural style the estimate engine understands. */
export function architectureForDirection(direction: StyleDirection) {
  switch (direction) {
    case "modernLuxe":
      return "luxury" as const;
    case "classic":
      return "traditional" as const;
    case "warmMinimal":
    case "cleanContemporary":
      return "minimal" as const;
    case "naturalEarthy":
      return "modern" as const;
  }
}
