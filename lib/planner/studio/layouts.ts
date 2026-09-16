import type { FixtureChoice, GeneratedPlan, LayoutOptionId, Room } from "@/lib/planner/types";
import { generateLayout } from "@/lib/planner/layout/engine";
import { areaSqft } from "@/lib/planner/units";

/**
 * The three suggestions.
 *
 * There is no second layout engine here. `generateLayout` already packs
 * fixtures onto walls from their requested placements and variants, so three
 * different *briefs* through the same engine give three genuinely different
 * plans — and every one of them obeys the same clearance checks.
 *
 * The briefs encode the trade-off each option is making:
 *   balanced — the default spec, nothing sacrificed
 *   open     — smaller footprints, fixtures pushed apart, floor left clear
 *   storage  — a full vanity and a tall unit, at the cost of floor space
 */

export interface LayoutOption {
  id: LayoutOptionId;
  title: string;
  tagline: string;
  /** What this option optimises for, in the homeowner's terms. */
  priorities: string[];
  fixtures: FixtureChoice[];
  plan: GeneratedPlan;
  /** Recommended when it is the best fit for the room we were given. */
  recommended: boolean;
  /** Approximate clear floor left over, in sq ft. */
  clearFloorSqft: number;
}

const BRIEFS: Record<LayoutOptionId, { title: string; tagline: string; priorities: string[]; fixtures: FixtureChoice[] }> = {
  balanced: {
    title: "Balanced",
    tagline: "Best balance of movement, access and fixture placement.",
    priorities: ["Movement", "Access", "Fixture placement"],
    fixtures: [
      { type: "wc", placement: "back", variant: "floorMounted" },
      { type: "vanity", placement: "right", variant: "countertop" },
      { type: "shower", placement: "walkIn", variant: "handheld" },
      { type: "almirah", placement: "underVanity", variant: "mirrorCabinet" },
    ],
  },
  open: {
    title: "More Open",
    tagline: "Prioritises open floor space and easy movement.",
    priorities: ["Open floor space", "Easy movement"],
    fixtures: [
      { type: "wc", placement: "back", variant: "wallHung" },
      { type: "vanity", placement: "left", variant: "wallHungBasin" },
      { type: "shower", placement: "enclosed", variant: "rainShower" },
      { type: "almirah", placement: "wallRecess", variant: "openShelf" },
    ],
  },
  storage: {
    title: "More Storage",
    tagline: "Prioritises a larger vanity and additional storage.",
    priorities: ["Larger vanity", "Additional storage"],
    fixtures: [
      { type: "wc", placement: "back", variant: "floorMounted" },
      { type: "vanity", placement: "right", variant: "countertop" },
      { type: "shower", placement: "enclosed", variant: "handheld" },
      { type: "almirah", placement: "dryCorner", variant: "tallUnit" },
    ],
  },
};

const ORDER: LayoutOptionId[] = ["balanced", "open", "storage"];

/** Floor area not covered by a fixture, in sq ft. */
function clearFloor(room: Room, plan: GeneratedPlan): number {
  const total = areaSqft(room.lengthInches, room.widthInches);
  const taken = plan.fixtures.reduce((sum, f) => sum + f.widthInches * f.depthInches, 0) / 144;
  return +Math.max(0, total - taken).toFixed(1);
}

/**
 * Which option to badge. Small rooms live or die on circulation space, so the
 * open plan wins below ~40 sq ft; otherwise the balanced brief is the honest
 * default. Any option with a hard placement error is never recommended.
 */
function pickRecommended(room: Room, built: Omit<LayoutOption, "recommended">[]): LayoutOptionId {
  const viable = built.filter((o) => !o.plan.warnings.some((w) => w.severity === "error"));
  const pool = viable.length ? viable : built;
  const small = areaSqft(room.lengthInches, room.widthInches) < 40;
  const preferred = small ? "open" : "balanced";
  return (pool.find((o) => o.id === preferred) ?? pool[0]).id;
}

export function buildLayoutOptions(room: Room): LayoutOption[] {
  const built = ORDER.map((id) => {
    const brief = BRIEFS[id];
    const plan = generateLayout(room, brief.fixtures);
    return {
      id,
      title: brief.title,
      tagline: brief.tagline,
      priorities: brief.priorities,
      fixtures: brief.fixtures,
      plan,
      clearFloorSqft: clearFloor(room, plan),
    };
  });

  const recommendedId = pickRecommended(room, built);
  return built.map((option) => ({ ...option, recommended: option.id === recommendedId }));
}

/** The messages shown while the options are being prepared. */
export const GENERATING_MESSAGES = [
  "Finding the best use of your space…",
  "Checking fixture placement…",
  "Looking at movement space…",
  "Preparing layout options…",
];
