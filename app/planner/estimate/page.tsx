"use client";

import { useEffect, useMemo } from "react";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { StudioShell } from "@/components/planner/studio/StudioShell";
import { StepFooter } from "@/components/planner/studio/StepFooter";
import { costByGroup, formatLakh, projectRange } from "@/lib/planner/studio/materials";
import { formatInr } from "@/lib/planner/units";
import type { CostTier } from "@/lib/planner/types";

/**
 * Screen 11 — the numbers.
 *
 * Shown as a range, never a single figure. The spread is asymmetric because
 * bathroom projects overrun more often than they come in under, and a tidy
 * midpoint would imply a confidence this cannot have.
 */

const LEVERS: { tier: CostTier; label: string }[] = [
  { tier: "budget", label: "Save money" },
  { tier: "costEffective", label: "Recommended" },
  { tier: "goodQuality", label: "Upgrade" },
];

export default function EstimatePage() {
  const t = useT();
  const { project } = useEnsureProject();
  const generateEstimate = useProjectStore((s) => s.generateEstimate);
  const setCostTier = useProjectStore((s) => s.setCostTier);

  const signature = project
    ? `${project.room.lengthInches}x${project.room.widthInches}:${project.style.costTier}:${project.fixtures.length}:${project.addOns.length}`
    : null;

  useEffect(() => {
    if (signature) generateEstimate();
  }, [signature, generateEstimate]);

  const estimate = project?.estimate ?? null;
  const groups = useMemo(() => costByGroup(estimate), [estimate]);
  const range = estimate ? projectRange(estimate.totalCostInr) : null;
  const target = project?.style.budgetInr ?? 0;
  const tier = project?.style.costTier ?? "costEffective";

  return (
    <StudioShell stepId="estimate" footer={<StepFooter stepId="estimate" />}>
      <header className="max-w-2xl">
        <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[38px]">
          {t("Know the numbers before you start.")}
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-body">
          {t("A planning estimate built from your layout, materials and chosen products.")}
        </p>
      </header>

      {!estimate || !range ? (
        <p className="mt-8 text-[14px] text-body-soft" role="status">
          {t("Working out your estimate…")}
        </p>
      ) : (
        <div className="mt-9 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-8">
          {/* ── Breakdown ────────────────────────────────────────────── */}
          <section className="rounded-2xl border border-hairline bg-surface-raised p-5 sm:p-6">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-body-soft">
              {t("Materials breakdown")}
            </h2>

            <dl className="mt-4">
              {groups.map((group) => (
                <div
                  key={group.key}
                  className="flex items-baseline justify-between gap-4 border-b border-hairline py-2.5"
                >
                  <dt className="text-[14.5px] text-ink">{t(group.label)}</dt>
                  <dd className="shrink-0 text-[14.5px] font-semibold text-ink tabular-nums">
                    {formatInr(group.totalInr)}
                  </dd>
                </div>
              ))}

              <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink/15 py-3">
                <dt className="text-[14.5px] font-semibold text-ink">
                  {t("Estimated materials")}
                </dt>
                <dd className="shrink-0 text-[16px] font-semibold text-ink tabular-nums">
                  {formatInr(estimate.materialCostInr)}
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-[14.5px] text-ink">
                  {t("Labour")}
                  <span className="ml-1.5 text-[12.5px] text-body-soft">
                    ({estimate.timeDays} {t("days")})
                  </span>
                </dt>
                <dd className="shrink-0 text-[14.5px] font-semibold text-ink tabular-nums">
                  {formatInr(estimate.labourCostInr)}
                </dd>
              </div>
            </dl>

            {/* ── Lever ──────────────────────────────────────────────── */}
            <h3 className="mt-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-body-soft">
              {t("Try a different level")}
            </h3>
            <div
              role="group"
              aria-label={t("Spending level")}
              className="mt-2.5 flex rounded-pill border border-hairline bg-surface p-0.5"
            >
              {LEVERS.map((lever) => (
                <button
                  key={lever.tier}
                  type="button"
                  onClick={() => setCostTier(lever.tier)}
                  aria-pressed={tier === lever.tier}
                  className={[
                    "flex-1 rounded-pill px-3 py-2 text-[13px] font-semibold transition-colors",
                    tier === lever.tier ? "bg-brand text-on-brand" : "text-body hover:text-ink",
                  ].join(" ")}
                >
                  {t(lever.label)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12.5px] text-body-soft">
              {t("Changes materials and products across the whole plan.")}
            </p>
          </section>

          {/* ── Range ────────────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-2xl border border-brand/30 bg-wash p-5 sm:p-6">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">
                {t("Estimated project range")}
              </h2>
              <p className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink tabular-nums sm:text-[36px]">
                {formatLakh(range.lowInr)} – {formatLakh(range.highInr)}
              </p>
              <p className="mt-1 text-[13px] font-medium text-body">{t("Planning estimate")}</p>

              {target > 0 && (
                <div className="mt-4 border-t border-brand/20 pt-4">
                  <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                    <span className="text-body">{t("Your target")}</span>
                    <span className="font-semibold text-ink tabular-nums">{formatInr(target)}</span>
                  </div>
                  <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-body">
                    <Icon
                      name={target >= range.lowInr ? "check" : "warning"}
                      size={13}
                      className="mt-0.5 shrink-0"
                    />
                    {target >= range.highInr
                      ? t("Comfortably within your target.")
                      : target >= range.lowInr
                        ? t("Around your target — the upper end would go over.")
                        : t("Above your target. Try the Save money level, or trim the fixture list.")}
                  </p>
                </div>
              )}

              <p className="mt-4 text-[12px] leading-relaxed text-body-soft">
                {t(
                  "Labour, local pricing and site conditions will change the final amount. Existing plumbing, wall condition and access are the usual surprises. Treat this as a starting point for quotes, not a quote.",
                )}
              </p>
            </div>
          </aside>
        </div>
      )}
    </StudioShell>
  );
}
