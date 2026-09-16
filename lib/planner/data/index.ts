/**
 * The bundled procurement data, typed. JSON imported directly (tsconfig
 * `resolveJsonModule` is on); the engine receives it by injection so it can be
 * unit-tested with small fixtures.
 */
import dealersJson from "./dealers.json";
import citiesJson from "./cities.json";
import type { Cities, Dealer, ProcurementData } from "./types";

export const procurementData: ProcurementData = {
  dealers: dealersJson as unknown as Dealer[],
  cities: citiesJson as unknown as Cities,
};

export * from "./types";
