/**
 * Types for the bundled procurement reference data (dealers + city centres).
 * Static, shipped in the bundle — the researched dealer listings from the
 * 15-Sept handoff (`5-data/{dealers,cities}.json`).
 */

/** The eight coverage cities. */
export type CityKey =
  | "delhi"
  | "jaipur"
  | "bengaluru"
  | "hyderabad"
  | "kolkata"
  | "bhubaneswar"
  | "mumbai"
  | "pune";

export type LabourBand = "delhi" | "mumbai" | "bengaluru" | "other";

export interface City {
  lat: number;
  lng: number;
  label: string;
  labour: LabourBand;
}

export type Cities = Record<CityKey, City>;

/** Trades a dealer can serve. `plumbing` is shown under Sanitaryware & Fittings. */
export type DealerTrade = "sanitary" | "tiles" | "plumbing" | "electrical" | "wiring";

export type DealerAuth = "brand-owned" | "authorised" | "multi-brand";

export interface Dealer {
  brand: string;
  trade: DealerTrade;
  city: CityKey;
  name: string;
  addr: string;
  /** Empty string when no phone was listed. */
  phone: string;
  lat: number | null;
  lng: number | null;
  /** True when the row has only the city centre's coords (never given a distance). */
  approx?: boolean;
  auth: DealerAuth;
  /** Source URL (kept for traceability; never shown). */
  src: string;
}

export interface ProcurementData {
  dealers: Dealer[];
  cities: Cities;
}

/* ── Pricing tables (Section B) ─────────────────────────────────────────── */

export type PriceUnit = "pc" | "ft" | "box" | "bag" | "cft" | "sqft" | "kg";

export interface PriceRow {
  unit: PriceUnit;
  value: number;
  mid: number;
  premium: number;
  est: boolean;
  src: string[];
}

export type Prices = Record<string, PriceRow>;

export interface BrandTierSet {
  t1: string[];
  t2: string[];
  t3: string[];
}

/** The four brand-selectable trades (pipes are excluded — not brand-selected). */
export type Trade = "sanitary" | "tiles" | "electrical" | "wiring";

export interface Brands {
  byItem: Record<string, BrandTierSet>;
  byTrade: Record<Trade, BrandTierSet>;
}

export type LabourTrade = "plumber" | "electrician" | "tilerFloor" | "tilerWall" | "mason";

export interface LabourRow {
  unit: string;
  rates: Record<LabourBand, number>;
  est: Record<LabourBand, boolean>;
  src: string[];
}

export type Labour = Record<LabourTrade, LabourRow>;

export type TileColour = "white" | "beige" | "grey" | "wood" | "dark";
export type TileFinish = "glossy" | "matt";

export interface TileLooks {
  colours: Record<TileColour, { base: string }>;
  finishes: TileFinish[];
}

/** The full injected data object the pricing engine receives. */
export interface PlannerData {
  prices: Prices;
  brands: Brands;
  labour: Labour;
  cities: Cities;
  dealers: Dealer[];
  tileLooks: TileLooks;
}
