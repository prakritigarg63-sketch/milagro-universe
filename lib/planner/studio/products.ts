import type {
  CostTier,
  PlacedFixture,
  ProductBand,
  ProductCategory,
  ProductOption,
  Room,
  StyleDirection,
} from "@/lib/planner/types";
import { areaSqft } from "@/lib/planner/units";

/**
 * Product suggestions for this bathroom.
 *
 * Not a catalogue. Every suggestion is derived from the project — room size,
 * what is actually in the layout, the chosen style and the spending tier — so
 * the list answers "what fits my bathroom" rather than "what is for sale".
 * A category with no matching fixture in the plan is not shown at all.
 *
 * Prices are seeded planning figures for a prototype, labelled indicative
 * everywhere they appear. They are not quotes and not live.
 */

/** Brands by band, matching the ones already named on the marketing site. */
const BRANDS_BY_TIER: Record<CostTier, string[]> = {
  budget: ["Parryware", "Hindware", "Somany"],
  costEffective: ["Jaquar", "CERA", "Hindware"],
  goodQuality: ["Jaquar", "GROHE", "Kajaria"],
  topOfLine: ["KOHLER", "GROHE", "Jaquar"],
};

/** Base indicative price per category, at the "costEffective" tier. */
const BASE_PRICE: Record<ProductCategory, number> = {
  wc: 12500,
  basin: 9500,
  shower: 8500,
  faucets: 5500,
  storage: 11000,
  tiles: 95,
  accessories: 4200,
};

/** Multiplier applied to the base price for each tier. */
const TIER_FACTOR: Record<CostTier, number> = {
  budget: 0.62,
  costEffective: 1,
  goodQuality: 1.7,
  topOfLine: 3.1,
};

/** Relative price of each alternative band. */
const BAND_FACTOR: Record<ProductBand, number> = {
  save: 0.72,
  recommended: 1,
  upgrade: 1.45,
};

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  wc: "WC",
  basin: "Basin / Vanity",
  shower: "Shower",
  faucets: "Faucets",
  storage: "Storage",
  tiles: "Tiles",
  accessories: "Accessories",
};

/** Product names per category, picked by band so the three read differently. */
const NAMES: Record<ProductCategory, Record<ProductBand, string>> = {
  wc: { save: "Floor-Mounted WC", recommended: "Wall-Hung WC", upgrade: "Rimless Wall-Hung WC" },
  basin: { save: "Pedestal Basin", recommended: "Countertop Basin + Vanity", upgrade: "Stone-Top Vanity Unit" },
  shower: { save: "Overhead Shower Set", recommended: "Rain Shower + Handheld", upgrade: "Thermostatic Shower System" },
  faucets: { save: "Single-Lever Mixer", recommended: "Basin Mixer Set", upgrade: "Concealed Mixer Set" },
  storage: { save: "Open Shelf Unit", recommended: "Mirror Cabinet", upgrade: "Tall Storage Unit" },
  tiles: { save: "Ceramic Tile", recommended: "Vitrified Tile", upgrade: "Large-Format Vitrified Tile" },
  accessories: { save: "Essentials Set", recommended: "Coordinated Accessory Set", upgrade: "Designer Accessory Set" },
};

/** Style-specific reason, so "why it fits" is not the same line every time. */
const STYLE_NOTE: Record<StyleDirection, string> = {
  warmMinimal: "Matches your warm minimal direction",
  modernLuxe: "Matches your modern luxe direction",
  naturalEarthy: "Matches your natural & earthy direction",
  cleanContemporary: "Matches your clean & contemporary direction",
  classic: "Matches your classic direction",
};

const TIER_NOTE: Record<CostTier, string> = {
  budget: "Within the budget-friendly tier",
  costEffective: "Within the Smart Value tier",
  goodQuality: "Within the premium tier",
  topOfLine: "Within the top-of-the-line tier",
};

function round(value: number): number {
  return Math.round(value / 50) * 50;
}

/** Which categories this project actually needs, from what is in the plan. */
export function categoriesFor(fixtures: PlacedFixture[]): ProductCategory[] {
  const present = new Set(fixtures.map((f) => f.type));
  const categories: ProductCategory[] = [];
  if (present.has("wc")) categories.push("wc");
  if (present.has("vanity")) categories.push("basin", "faucets");
  if (present.has("shower")) categories.push("shower");
  if (present.has("almirah")) categories.push("storage");
  categories.push("tiles", "accessories");
  return categories;
}

function priceFor(category: ProductCategory, tier: CostTier, band: ProductBand): number {
  return round(BASE_PRICE[category] * TIER_FACTOR[tier] * BAND_FACTOR[band]);
}

/** Reasons this option suits this project, in the homeowner's terms. */
function whyItFits(
  category: ProductCategory,
  band: ProductBand,
  tier: CostTier,
  style: StyleDirection | null,
  room: Room,
): string[] {
  const reasons: string[] = [];
  const sqft = areaSqft(room.lengthInches, room.widthInches);

  if (category === "wc" && band !== "save" && sqft < 45) {
    reasons.push("Compact footprint for a smaller room");
  } else if (category === "basin" && band === "upgrade" && sqft < 45) {
    reasons.push("Adds storage without taking more floor");
  } else if (category === "tiles") {
    reasons.push(`Sized for about ${Math.round(sqft)} sq ft of floor`);
  } else if (band === "save") {
    reasons.push("Keeps the total down");
  } else {
    reasons.push("Sized for your layout");
  }

  if (style) reasons.push(STYLE_NOTE[style]);
  reasons.push(TIER_NOTE[tier]);
  return reasons;
}

export interface CategorySuggestion {
  category: ProductCategory;
  label: string;
  /** Recommended first, then the save and upgrade alternatives. */
  options: ProductOption[];
  /** Unit for the price, e.g. "per sq ft" for tiles. */
  priceUnit?: string;
}

export function buildSuggestions(
  fixtures: PlacedFixture[],
  room: Room,
  tier: CostTier,
  style: StyleDirection | null,
): CategorySuggestion[] {
  const brands = BRANDS_BY_TIER[tier];

  return categoriesFor(fixtures).map((category, index) => {
    const bands: ProductBand[] = ["recommended", "save", "upgrade"];
    const options = bands.map((band, bandIndex) => ({
      id: `${category}-${band}`,
      category,
      name: NAMES[category][band],
      // Rotate the brand list so the page is not three columns of one name.
      brand: brands[(index + bandIndex) % brands.length],
      indicativePriceInr: priceFor(category, tier, band),
      band,
      whyItFits: whyItFits(category, band, tier, style, room),
    }));

    return {
      category,
      label: CATEGORY_LABEL[category],
      options,
      priceUnit: category === "tiles" ? "per sq ft" : undefined,
    };
  });
}

/** The default pick per category — the recommended option. */
export function defaultSelections(suggestions: CategorySuggestion[]): Record<string, string> {
  return Object.fromEntries(
    suggestions.map((s) => [s.category, `${s.category}-recommended`]),
  );
}

export const BAND_LABEL: Record<ProductBand, string> = {
  save: "Save",
  recommended: "Recommended",
  upgrade: "Upgrade",
};
