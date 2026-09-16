import type { BomLine, Estimate, MaterialGroup } from "@/lib/planner/types";

/**
 * The bill of materials, grouped the way a homeowner would shop for it.
 *
 * This is a presentation of `generateEstimate`'s BOM, not a second calculation.
 * If the two ever disagree the estimate is wrong, so there is deliberately no
 * arithmetic here beyond bucketing and a buffer allowance.
 */

type GroupKey = MaterialGroup["key"];

const GROUP_LABEL: Record<GroupKey, string> = {
  tiles: "Tiles",
  plumbing: "Plumbing",
  fixtures: "Fixtures",
  construction: "Construction",
  accessories: "Accessories",
};

/** Extra to order over the calculated quantity, per group. */
const BUFFER: Partial<Record<GroupKey, number>> = {
  tiles: 0.1,
  construction: 0.05,
};

/** Which bucket a BOM line belongs in, from its key. */
function groupOf(line: BomLine): GroupKey {
  const { key } = line;
  if (key.startsWith("fixture:")) return "fixtures";
  if (key === "tiles") return "tiles";
  if (key.startsWith("pipe-") || key === "angle-valve" || key === "diverter" || key === "p-trap") {
    return "plumbing";
  }
  if (key === "cement" || key === "badarpur") return "construction";
  // Everything else is an add-on: towel rail, niche, exhaust fan and friends.
  return "accessories";
}

const GROUP_ORDER: GroupKey[] = ["tiles", "plumbing", "fixtures", "construction", "accessories"];

export function groupMaterials(estimate: Estimate | null): MaterialGroup[] {
  if (!estimate) return [];

  const buckets = new Map<GroupKey, MaterialGroup>();
  for (const key of GROUP_ORDER) {
    buckets.set(key, { key, label: GROUP_LABEL[key], lines: [] });
  }

  for (const line of estimate.bom) {
    const key = groupOf(line);
    buckets.get(key)?.lines.push({
      key: line.key,
      label: line.label,
      quantity: line.quantity,
      unit: line.unit,
      bufferPct: BUFFER[key],
    });
  }

  return GROUP_ORDER.map((k) => buckets.get(k)!).filter((g) => g.lines.length > 0);
}

/** Cost per group, for the estimate breakdown. */
export function costByGroup(estimate: Estimate | null): { key: GroupKey; label: string; totalInr: number }[] {
  if (!estimate) return [];
  const totals = new Map<GroupKey, number>();
  for (const line of estimate.bom) {
    const key = groupOf(line);
    totals.set(key, (totals.get(key) ?? 0) + line.totalInr);
  }
  return GROUP_ORDER.filter((k) => totals.has(k)).map((k) => ({
    key: k,
    label: GROUP_LABEL[k],
    totalInr: totals.get(k) ?? 0,
  }));
}

/**
 * The range shown to the homeowner.
 *
 * A single number implies a precision this cannot have: local rates, site
 * conditions and what a contractor already has in the van all move it. The
 * spread is deliberately asymmetric — estimates overrun far more often than
 * they come in under.
 */
export function projectRange(totalInr: number): { lowInr: number; highInr: number } {
  return {
    lowInr: Math.round((totalInr * 0.94) / 1000) * 1000,
    highInr: Math.round((totalInr * 1.18) / 1000) * 1000,
  };
}

/** "₹1.10L" — lakh notation, which is how these numbers are spoken in India. */
export function formatLakh(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}
