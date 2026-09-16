"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { StudioShell } from "@/components/planner/studio/StudioShell";
import { StepFooter } from "@/components/planner/studio/StepFooter";
import { AffixInput } from "@/components/planner/studio/AffixInput";
import { formatInr } from "@/lib/planner/units";
import { generateEstimate } from "@/lib/planner/estimate/engine";
import type { CostTier } from "@/lib/planner/types";

/**
 * Screen 8 — how do you want to spend?
 *
 * Deliberately not "what is your budget?" first. Asked cold, that question gets
 * a defensive number or no answer at all; asked as "what matters to you",
 * people answer honestly. The number is optional and comes second.
 */

interface Tier {
  id: CostTier;
  symbol: string;
  label: string;
  blurb: string;
  detail: string[];
  badge?: string;
}

const TIERS: Tier[] = [
  {
    id: "budget",
    symbol: "₹",
    label: "Budget friendly",
    blurb: "Reliable essentials. Prioritize value.",
    detail: ["Trusted entry-level brands", "Standard ceramic and fittings", "Fewer optional extras"],
  },
  {
    id: "costEffective",
    symbol: "₹₹",
    label: "Smart value",
    blurb: "Good quality without unnecessary upgrades.",
    detail: ["Mid-range brands with good service", "Better taps and mixers", "Where most homeowners land"],
    badge: "Most Popular",
  },
  {
    id: "goodQuality",
    symbol: "₹₹₹",
    label: "Premium",
    blurb: "Better finishes, brands and warranties.",
    detail: ["Longer warranties", "Premium surface finishes", "Wider design choice"],
  },
  {
    id: "topOfLine",
    symbol: "₹₹₹₹",
    label: "Top of the line",
    blurb: "Premium fixtures and finishes throughout.",
    detail: ["Flagship ranges", "Designer fittings", "Specified down to the detail"],
  },
];

export default function BudgetPage() {
  const t = useT();
  const { project } = useEnsureProject();
  const setCostTier = useProjectStore((s) => s.setCostTier);
  const setBudget = useProjectStore((s) => s.setBudget);

  const [draft, setDraft] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [clamped, setClamped] = useState(false);

  const tier = project?.style.costTier ?? null;
  // The tier always has a value; this is whether anyone picked it.
  const tierChosen = project?.tierChosen ?? false;
  const budget = project?.style.budgetInr ?? 0;

  /**
   * What each tier actually costs for THIS bathroom.
   *
   * Priced through the real estimator rather than from a table of round
   * numbers, so the floor follows rates.ts instead of drifting from it. And it
   * is this room: a powder room and a master bath get different floors for the
   * same tier, which is the only thing that makes quoting a figure honest.
   */
  const tierFloor = useMemo(() => {
    if (!project) return null;
    return Object.fromEntries(
      TIERS.map((item) => [
        item.id,
        generateEstimate(
          project.room,
          { ...project.style, costTier: item.id },
          project.fixtures,
          project.addOns,
        ).totalCostInr,
      ]),
    ) as Record<CostTier, number>;
  }, [project]);

  const floor = tier && tierFloor ? tierFloor[tier] : 0;

  /**
   * A target under the floor is not a preference, it is a contradiction: the
   * tier has already decided which products get specified, and this is what
   * those products cost in this room. Accepting the number would only move the
   * disappointment to the estimate screen, so raise it and say why.
   */
  function commitBudget(raw: string) {
    const digits = Number(raw.replace(/[^\d]/g, ""));
    if (!Number.isFinite(digits) || digits <= 0) {
      setDraft(null);
      return;
    }
    const below = floor > 0 && digits < floor;
    setBudget(below ? floor : digits);
    setClamped(below);
    setSkipped(false);
    setDraft(null);
  }

  /** Choosing a tier seeds an empty target and lifts one that is now too low. */
  function chooseTier(next: CostTier) {
    setCostTier(next);
    const nextFloor = tierFloor?.[next] ?? 0;
    if (nextFloor <= 0) return;
    if (budget <= 0) {
      setBudget(nextFloor);
      setClamped(false);
    } else if (budget < nextFloor) {
      setBudget(nextFloor);
      setClamped(true);
    }
    setSkipped(false);
  }

  return (
    <StudioShell
      stepId="budget"
      footer={
        <StepFooter
          stepId="budget"
          blockedReason={tierChosen ? null : t("Choose how you’d like to spend")}
        />
      }
    >
      <header className="max-w-2xl">
        <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[38px]">
          {t("How do you want to spend?")}
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-body">
          {t("This shapes which products we suggest — not how much you have to spend.")}
        </p>
      </header>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((item) => {
          // Nothing reads as chosen until it has been, so the default tier
          // cannot pass itself off as the homeowner's answer.
          const active = tierChosen && tier === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseTier(item.id)}
              aria-pressed={active}
              className={[
                "relative flex flex-col rounded-2xl border p-5 text-left transition-[border-color,transform,box-shadow] duration-200",
                "hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
                active
                  ? "border-brand bg-surface-raised shadow-[0_10px_30px_rgb(7_140_200/0.15)]"
                  : "border-hairline bg-surface-raised hover:border-brand/45",
              ].join(" ")}
            >
              {item.badge && (
                <span className="absolute -top-2.5 left-5 rounded-pill bg-clay px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-on-clay">
                  {t(item.badge)}
                </span>
              )}

              <span className="flex items-center justify-between">
                <span className="text-[19px] font-semibold tracking-[0.02em] text-brand">
                  {item.symbol}
                </span>
                {active && <Icon name="check" size={16} className="text-brand" />}
              </span>

              <span className="mt-2 block text-[16px] font-semibold leading-snug text-ink">
                {t(item.label)}
              </span>
              <span className="mt-1 block text-[13px] leading-relaxed text-body">
                {t(item.blurb)}
              </span>

              {tierFloor && (
                <span className="mt-3 block text-[12.5px] font-semibold tabular-nums text-ink">
                  {t("From")} {formatInr(tierFloor[item.id])}
                </span>
              )}

              <ul className="mt-3 space-y-1">
                {item.detail.map((d) => (
                  <li key={d} className="flex items-start gap-1.5 text-[12.5px] text-body-soft">
                    <Icon name="check" size={12} className="mt-0.5 shrink-0 text-brand/60" />
                    {t(d)}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* The number, asked second and optional. */}
      <section className="mt-9 max-w-xl rounded-2xl border border-hairline bg-surface-raised p-5 sm:p-6">
        <h2 className="text-[17px] font-semibold text-ink">{t("Do you have a target budget?")}</h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-body">
          {t("Optional. We’ll show how the estimate compares as you go.")}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <AffixInput
            label={t("Target budget in rupees")}
            showLabel={false}
            prefix="₹"
            inputMode="numeric"
            placeholder={t("e.g. 1,50,000")}
            className="min-w-[200px] flex-1"
            value={draft ?? (budget ? budget.toLocaleString("en-IN") : "")}
            onValueChange={(v) => {
              setDraft(v);
              setSkipped(false);
              setClamped(false);
            }}
            onCommit={commitBudget}
          />

          <button
            type="button"
            onClick={() => {
              setSkipped(true);
              setDraft(null);
            }}
            className="h-11 rounded-pill px-4 text-[13.5px] font-semibold text-body transition-colors hover:bg-wash hover:text-ink"
          >
            {t("Skip for now")}
          </button>
        </div>

        {clamped && floor > 0 ? (
          <p className="mt-3 text-[12.5px] leading-relaxed text-clay" role="status">
            {t("This tier starts at")} {formatInr(floor)} —{" "}
            {t("we’ve set your target there. Choose a lower tier to spend less.")}
          </p>
        ) : skipped ? (
          <p className="mt-3 text-[12.5px] text-body-soft" role="status">
            {t("No problem — we’ll still show a full estimate.")}
          </p>
        ) : (
          budget > 0 && (
            <p className="mt-3 text-[12.5px] text-body-soft" role="status">
              {t("Target")}: {formatInr(budget)}
              {floor > 0 && <> · {t("minimum for this tier")} {formatInr(floor)}</>}
            </p>
          )
        )}
      </section>
    </StudioShell>
  );
}
