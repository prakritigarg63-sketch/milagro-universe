/**
 * Section B — labour engine (spec B §3.5 labour drivers, §4.3). Pure. Labour
 * quantities are the spec's deliberate simplification (points / areas / days);
 * rates come from the researched bands keyed by the resolved city's labour band.
 */
import type { Project } from "@/lib/planner/types";
import type { LabourBand, LabourTrade, PlannerData } from "@/lib/planner/data/types";
import { cityLabourBand } from "./location";

export interface LabourLine {
  trade: LabourTrade;
  qty: number;
  unit: string;
  rate: number;
  total: number;
  est: boolean;
}

export interface LabourEstimate {
  band: LabourBand | null;
  rows: LabourLine[];
  total: number;
}

function count(project: Project, type: Project["fixtures"][number]["type"]): number {
  return project.fixtures.filter((f) => f.type === type).length;
}
function addon(project: Project, a: Project["addOns"][number]): number {
  return project.addOns.includes(a) ? 1 : 0;
}

/** Labour drivers derived from Section A state (spec B §3.5). */
function drivers(project: Project) {
  const room = project.room;
  const floorSqft = (room.lengthInches * room.widthInches) / 144;
  const wallGross = (2 * (room.lengthInches + room.widthInches) * room.heightInches) / 144;
  const doorSqft = (room.door.widthInches * 80) / 144;
  const windowSqft = room.window ? (room.window.widthInches * 36) / 144 : 0;
  const wallSqft = Math.max(0, wallGross - doorSqft - windowSqft);
  const totalTileSqft = floorSqft + wallSqft;

  const applianceCount = addon(project, "geyser") + addon(project, "exhaustFan");
  const switchesSockets = applianceCount + 2;

  return {
    plumberPoints:
      count(project, "wc") +
      count(project, "vanity") +
      count(project, "shower") +
      addon(project, "geyser") +
      addon(project, "healthFaucet") +
      addon(project, "floorDrain"),
    electricianPoints: applianceCount + switchesSockets,
    tilerFloorSqft: Math.round(floorSqft),
    tilerWallSqft: Math.round(wallSqft),
    masonDays: Math.max(2, Math.ceil(totalTileSqft / 120)),
  };
}

/** Labour rows for the project's resolved city, or an empty estimate if no city. */
export function labourEstimate(project: Project, data: PlannerData): LabourEstimate {
  const city = project.location?.city ?? null;
  if (!city) return { band: null, rows: [], total: 0 };
  const band = cityLabourBand(city, data.cities);
  const d = drivers(project);

  const qtyFor: Record<LabourTrade, number> = {
    plumber: d.plumberPoints,
    electrician: d.electricianPoints,
    tilerFloor: d.tilerFloorSqft,
    tilerWall: d.tilerWallSqft,
    mason: d.masonDays,
  };

  const rows: LabourLine[] = (Object.keys(qtyFor) as LabourTrade[])
    .map((trade) => {
      const row = data.labour[trade];
      const qty = qtyFor[trade];
      const rate = row.rates[band];
      return {
        trade,
        qty,
        unit: row.unit,
        rate,
        total: Math.round(qty * rate),
        est: row.est[band] ?? false,
      };
    })
    .filter((r) => r.qty > 0);

  const total = rows.reduce((s, r) => s + r.total, 0);
  return { band, rows, total };
}
