"use client";

import { useEffect, useMemo } from "react";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { StudioShell } from "@/components/planner/studio/StudioShell";
import { StepFooter } from "@/components/planner/studio/StepFooter";
import { groupMaterials } from "@/lib/planner/studio/materials";

/**
 * Screen 10 — what the design needs.
 *
 * Quantities come from the estimate engine's bill of materials, not from a
 * second calculation here, so the numbers on this page and the money on the
 * next one can never drift apart.
 */
export default function MaterialsPage() {
  const t = useT();
  const { project } = useEnsureProject();
  const generateEstimate = useProjectStore((s) => s.generateEstimate);

  // The estimate is the source for this page, so make sure one exists and is
  // current with whatever the homeowner changed upstream.
  const signature = project
    ? `${project.room.lengthInches}x${project.room.widthInches}:${project.style.costTier}:${project.fixtures.length}:${project.addOns.length}`
    : null;

  useEffect(() => {
    if (signature) generateEstimate();
  }, [signature, generateEstimate]);

  const groups = useMemo(() => groupMaterials(project?.estimate ?? null), [project?.estimate]);

  return (
    <StudioShell stepId="materials" footer={<StepFooter stepId="materials" />}>
      <header className="max-w-2xl">
        <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[38px]">
          {t("Here’s what your design may need.")}
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-body">
          {t("Worked out from your room size, layout and the fixtures you chose.")}
        </p>
      </header>

      {groups.length === 0 ? (
        <p className="mt-8 text-[14px] text-body-soft" role="status">
          {t("Working out your materials…")}
        </p>
      ) : (
        <div className="mt-9 grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <section
              key={group.key}
              className="rounded-2xl border border-hairline bg-surface-raised p-5"
            >
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-body-soft">
                {t(group.label)}
              </h2>

              <dl className="mt-3 space-y-2.5">
                {group.lines.map((line) => (
                  <div
                    key={line.key}
                    className="flex items-baseline justify-between gap-4 border-b border-hairline pb-2.5 last:border-0 last:pb-0"
                  >
                    <dt className="text-[14px] text-ink">{t(line.label)}</dt>
                    <dd className="shrink-0 text-right text-[14px] font-semibold text-ink">
                      {line.quantity.toLocaleString("en-IN")}{" "}
                      <span className="font-normal text-body-soft">{t(line.unit)}</span>
                    </dd>
                  </div>
                ))}
              </dl>

              {group.lines[0]?.bufferPct != null && (
                <p className="mt-3 flex items-start gap-1.5 text-[12.5px] text-body-soft">
                  <Icon name="plus" size={13} className="mt-0.5 shrink-0" />
                  {t("Recommended buffer")}: +{Math.round((group.lines[0].bufferPct ?? 0) * 100)}%{" "}
                  {t("for cuts and breakage")}
                </p>
              )}
            </section>
          ))}
        </div>
      )}

      <p className="mt-6 flex max-w-2xl items-start gap-2 rounded-xl border border-hairline bg-wash px-4 py-3.5 text-[13px] leading-relaxed text-body">
        <Icon name="warning" size={15} className="mt-0.5 shrink-0 text-body-soft" />
        {t(
          "Quantities are planning estimates and should be verified on site before purchase. Wall heights, existing surfaces and wastage all change what you actually need.",
        )}
      </p>
    </StudioShell>
  );
}
