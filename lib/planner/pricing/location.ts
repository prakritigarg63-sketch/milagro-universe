/**
 * Location helpers (pure) shared by Section B (labour band) and Section D
 * (dealer distances). The browser `navigator.geolocation` call lives in the B5
 * component; everything here is deterministic and testable.
 */
import type { Cities, CityKey, LabourBand } from "@/lib/planner/data/types";

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

/** Nearest coverage city to a coordinate (spec B §3.3 — device location snaps here). */
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

/** Which of the four labour bands a coverage city uses. */
export function cityLabourBand(city: CityKey, cities: Cities): LabourBand {
  return cities[city].labour;
}
