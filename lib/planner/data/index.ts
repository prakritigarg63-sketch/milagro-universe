/**
 * The bundled reference data, typed. JSON imported directly (tsconfig
 * `resolveJsonModule` is on); the engines receive it by injection so they can be
 * unit-tested with small fixtures.
 */
import dealersJson from "./dealers.json";
import citiesJson from "./cities.json";
import pricesJson from "./prices.json";
import brandsJson from "./brands.json";
import labourJson from "./labour.json";
import tileLooksJson from "./tile-looks.json";
import type {
  Brands,
  Cities,
  Dealer,
  Labour,
  PlannerData,
  Prices,
  ProcurementData,
  TileLooks,
} from "./types";

/** Section D — dealers + cities. */
export const procurementData: ProcurementData = {
  dealers: dealersJson as unknown as Dealer[],
  cities: citiesJson as unknown as Cities,
};

/** Full table set for the pricing engine (Section B). */
export const plannerData: PlannerData = {
  prices: pricesJson as unknown as Prices,
  brands: brandsJson as unknown as Brands,
  labour: labourJson as unknown as Labour,
  cities: citiesJson as unknown as Cities,
  dealers: dealersJson as unknown as Dealer[],
  tileLooks: tileLooksJson as unknown as TileLooks,
};

export * from "./types";
