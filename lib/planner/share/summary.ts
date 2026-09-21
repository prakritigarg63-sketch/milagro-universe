import { FINISH_GROUPS, optionFor } from "@/lib/planner/studio/finishes";
import type { Finishes, FinishSurface } from "@/lib/planner/types";

/**
 * One line of the finishes summary printed on a shared design card.
 *
 * `label` and `value` are the registry's English strings — the drawing code
 * translates them, so this module stays pure and free of React/i18n.
 */
export interface FinishSummaryRow {
  surface: FinishSurface;
  label: string;
  value: string;
  color: string;
}

/**
 * The finishes the homeowner has actually chosen, in the toolbar's order.
 *
 * Anything left unpicked is skipped, so the card shows a real design rather than
 * a table of blanks.
 */
export function finishSummary(finishes: Finishes | undefined): FinishSummaryRow[] {
  if (!finishes) return [];
  const rows: FinishSummaryRow[] = [];
  for (const group of FINISH_GROUPS) {
    const option = optionFor(group.surface, finishes[group.surface]);
    if (!option) continue;
    rows.push({ surface: group.surface, label: group.label, value: option.label, color: option.color });
  }
  return rows;
}
