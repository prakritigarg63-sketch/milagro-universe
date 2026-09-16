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
