/**
 * Length entry in whatever unit the homeowner thinks in.
 *
 * The project stores inches; these convert at the edge. Four units are offered
 * because Indian homeowners quote bathrooms in feet, builders in millimetres,
 * and imported fittings arrive in centimetres — forcing one of those on the
 * others is how a measurement gets typed in wrong.
 */

export type LengthUnit = "ft" | "in" | "cm" | "m";

export const LENGTH_UNITS: LengthUnit[] = ["ft", "in", "cm", "m"];

const PER_INCH: Record<LengthUnit, number> = {
  in: 1,
  ft: 1 / 12,
  cm: 2.54,
  m: 0.0254,
};

/** Decimal places worth showing for each unit at bathroom scale. */
const PRECISION: Record<LengthUnit, number> = { ft: 2, in: 0, cm: 0, m: 2 };

export function fromInches(inches: number, unit: LengthUnit): number {
  return +(inches * PER_INCH[unit]).toFixed(PRECISION[unit]);
}

export function toInches(value: number, unit: LengthUnit): number {
  return value / PER_INCH[unit];
}

/** Display string with the unit appended, e.g. "8.5 ft". */
export function formatLength(inches: number, unit: LengthUnit): string {
  return `${fromInches(inches, unit)} ${unit}`;
}

/**
 * Parse typed input leniently. Accepts "8", "8.5", "8'6\"", "8 ft 6 in".
 * Returns inches, or null if nothing usable was typed — the caller decides
 * whether that means "keep the old value" or "show an error".
 */
export function parseLength(raw: string, unit: LengthUnit): number | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;

  // Feet-and-inches, in any of the common spellings.
  const feetInches = text.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft|feet)\s*(\d+(?:\.\d+)?)?\s*(?:"|in|inch(?:es)?)?$/);
  if (feetInches) {
    const feet = Number(feetInches[1]);
    const inches = feetInches[2] ? Number(feetInches[2]) : 0;
    return feet * 12 + inches;
  }

  const plain = Number(text.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(plain) || plain <= 0) return null;
  return toInches(plain, unit);
}

/** Floor area, in the unit family the homeowner is working in. */
export function formatArea(lengthInches: number, widthInches: number, unit: LengthUnit): string {
  const metric = unit === "cm" || unit === "m";
  if (metric) {
    const sqm = (lengthInches * 0.0254) * (widthInches * 0.0254);
    return `${sqm.toFixed(2)} m²`;
  }
  const sqft = (lengthInches / 12) * (widthInches / 12);
  return `${sqft.toFixed(1)} sq ft`;
}

/**
 * The unit a *fixture* should be quoted in.
 *
 * Rooms read naturally in feet or metres; a vanity does not — "2 ft × 1.33 ft"
 * is a worse answer than "24 × 16 in". Step down to the fine unit of whichever
 * system the homeowner is already working in.
 */
export function fixtureUnit(unit: LengthUnit): LengthUnit {
  return unit === "ft" || unit === "in" ? "in" : "cm";
}

/** Formats a fixture dimension at fixture scale. */
export function formatFixtureLength(inches: number, unit: LengthUnit): string {
  return formatLength(inches, fixtureUnit(unit));
}
