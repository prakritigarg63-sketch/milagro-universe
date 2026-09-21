/**
 * Section D — procurement engine (spec D §4). Pure: given a resolved location
 * and the injected data, group real dealers by trade near the customer.
 *
 * Adapted from the spec: the pricing section (which would pick one brand per
 * trade) is not wired here, so every brand's dealers for the trade are shown,
 * ordered brand-owned → authorised → multi-brand, then by distance when we have
 * it. Only ~5 of 222 rows carry real coordinates, so most results are the
 * city's listing without distances — exactly the fallback the spec describes.
 */
import type { Cities, CityKey, Dealer, DealerAuth, DealerTrade, ProcurementData } from "@/lib/planner/data/types";

export interface LatLng {
  lat: number;
  lng: number;
}

/** Great-circle distance in km. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Nearest coverage city to a coordinate. */
export function snapToCity(point: LatLng, cities: Cities): CityKey {
  let best: CityKey = "delhi";
  let bestD = Infinity;
  for (const key of Object.keys(cities) as CityKey[]) {
    const d = haversineKm(point, cities[key]);
    if (d < bestD) {
      bestD = d;
      best = key;
    }
  }
  return best;
}

/** How the customer's location was resolved. */
export interface ResolvedLocation {
  city: CityKey;
  source: "device" | "chip";
  lat?: number | null;
  lng?: number | null;
}

/** The four display groups, in order. `sanitary` also absorbs `plumbing`. */
export type GroupKey = "sanitary" | "tiles" | "electrical" | "wiring";

const GROUP_TRADES: Record<GroupKey, DealerTrade[]> = {
  sanitary: ["sanitary", "plumbing"],
  tiles: ["tiles"],
  electrical: ["electrical"],
  wiring: ["wiring"],
};

export const GROUP_ORDER: GroupKey[] = ["sanitary", "tiles", "electrical", "wiring"];

const AUTH_RANK: Record<DealerAuth, number> = { "brand-owned": 0, authorised: 1, "multi-brand": 2 };

export interface DealerResult extends Dealer {
  /** Present only for device-located results with real coordinates. */
  distKm?: number;
}

export interface DealerGroup {
  key: GroupKey;
  dealers: DealerResult[];
  /** A short note about how the list was filtered (widened radius, city fallback…). */
  note: "within5" | "widened15" | "cityOnly" | "chipCity" | "empty";
}

export interface ProcurementResult {
  city: CityKey;
  groups: DealerGroup[];
}

/** Build the trade groups of dealers for a resolved location (spec D §4). */
export function dealersFor(loc: ResolvedLocation, data: ProcurementData): ProcurementResult {
  const inCity = data.dealers.filter((d) => d.city === loc.city);

  const groups = GROUP_ORDER.map((key): DealerGroup => {
    const trades = GROUP_TRADES[key];
    const rows = inCity.filter((d) => trades.includes(d.trade));
    if (rows.length === 0) return { key, dealers: [], note: "empty" };

    const byAuthThenName = (a: Dealer, b: Dealer) =>
      AUTH_RANK[a.auth] - AUTH_RANK[b.auth] || a.name.localeCompare(b.name);

    // Chip source, or no usable device coords → the city's listing, no distances.
    if (loc.source !== "device" || loc.lat == null || loc.lng == null) {
      return { key, dealers: [...rows].sort(byAuthThenName), note: "chipCity" };
    }

    const here: LatLng = { lat: loc.lat, lng: loc.lng };
    const withDist = rows
      .filter((d) => d.lat != null && d.lng != null && !d.approx)
      .map((d) => ({ ...d, distKm: haversineKm(here, { lat: d.lat!, lng: d.lng! }) }))
      .sort((a, b) => a.distKm - b.distKm);
    const approxRows = rows.filter((d) => d.approx || d.lat == null || d.lng == null).sort(byAuthThenName);

    const within5 = withDist.filter((d) => d.distKm <= 5);
    if (within5.length > 0) return { key, dealers: [...within5, ...approxRows], note: "within5" };

    const within15 = withDist.filter((d) => d.distKm <= 15);
    if (within15.length > 0) return { key, dealers: [...within15, ...approxRows], note: "widened15" };

    // Nothing close enough to distinguish → the whole city listing.
    return { key, dealers: [...rows].sort(byAuthThenName), note: "cityOnly" };
  });

  return { city: loc.city, groups };
}

/** A Google Maps search link for a dealer — no API key needed. */
export function mapsUrl(d: Dealer): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${d.name} ${d.addr}`)}`;
}
