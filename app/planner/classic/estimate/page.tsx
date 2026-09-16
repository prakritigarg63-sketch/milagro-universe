"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/planner/shell/WizardShell";
import { ProgressBar } from "@/components/planner/shell/ProgressBar";
import { StepFooterCta } from "@/components/planner/sections/StepFooterCta";
import { StepCard } from "@/components/planner/ui/StepCard";
import { MaterialIcon } from "@/components/planner/ui/MaterialIcon";
import { useI18n } from "@/lib/planner/i18n/provider";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { formatInr } from "@/lib/planner/units";

export default function EstimateStepPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { ready } = useEnsureProject();
  const project = useProjectStore((s) => s.project);
  const generateEstimate = useProjectStore((s) => s.generateEstimate);

  useEffect(() => {
    if (ready) generateEstimate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const estimate = project?.estimate ?? null;
  const budget = project?.style.budgetInr ?? 0;
  const overBudget = estimate ? estimate.totalCostInr > budget : false;

  return (
    <WizardShell
      subtitle={t.appSub5}
      progress={<ProgressBar badge={t.step5Badge} step={5} total={6} icon="receipt_long" />}
      // The total stays in view while the line items scroll.
      aside={
        ready && estimate ? (
          <StepCard style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MaterialIcon name="payments" size={20} color="var(--color-primary-accent)" />
              <h2 style={{ fontWeight: 700, fontSize: "calc(17px * var(--pl-fs, 1))", margin: 0, color: "var(--color-on-surface)" }}>
                {t.costTitle}
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 14,
                borderRadius: 12,
                background: "var(--color-primary-tint)",
                border: "1px solid var(--color-primary-tint-border)",
              }}
            >
              <SummaryRow label={t.materialCost} value={formatInr(estimate.materialCostInr)} />
              <SummaryRow label={t.labourCost} value={formatInr(estimate.labourCostInr)} />
              <div style={{ height: 1, background: "var(--color-primary-tint-border)" }} />
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: "calc(14px * var(--pl-fs, 1))", fontWeight: 700, color: "var(--color-on-surface)" }}>{t.totalCost}</span>
                <span style={{ fontSize: "calc(26px * var(--pl-fs, 1))", fontWeight: 800, color: "var(--color-primary-accent)", fontVariantNumeric: "tabular-nums" }}>
                  {formatInr(estimate.totalCostInr)}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <InfoTile icon="schedule" label={t.timeEstimate} value={`${estimate.timeDays} ${t.daysUnit}`} />
              <InfoTile
                icon={overBudget ? "trending_up" : "check_circle"}
                label={t.budgetLabel}
                value={formatInr(budget)}
                tone={overBudget ? "warn" : "ok"}
                badge={overBudget ? t.overBudget : t.withinBudget}
              />
            </div>
          </StepCard>
        ) : undefined
      }
      footer={
        <StepFooterCta
          label={t.s5CtaText}
          subLabel={t.s5CtaSub}
          onClick={() => router.push("/planner/brief")}
          onBack={() => router.push("/planner/plan")}
          backLabel={t.backCta}
          disabled={!ready}
        />
      }
    >
      {ready && estimate ? (
        <div className="pl-sections">
          <StepCard style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MaterialIcon name="list_alt" size={20} color="var(--color-primary-accent)" />
              <div>
                <h2 style={{ fontWeight: 700, fontSize: "calc(17px * var(--pl-fs, 1))", margin: 0, color: "var(--color-on-surface)" }}>
                  {t.bomTitle}
                </h2>
                <p style={{ fontSize: "calc(12px * var(--pl-fs, 1))", margin: 0, color: "var(--color-on-surface-variant)" }}>{t.bomSub}</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {estimate.bom.map((l, i) => (
                <div
                  key={l.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "11px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--color-surface-high)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "calc(14px * var(--pl-fs, 1))", fontWeight: 600, color: "var(--color-on-surface)" }}>
                      {l.label}
                    </span>
                    <span style={{ fontSize: "calc(12px * var(--pl-fs, 1))", color: "var(--color-on-surface-variant)", fontVariantNumeric: "tabular-nums" }}>
                      {l.quantity} {l.unit} × {formatInr(l.unitCostInr)}
                    </span>
                  </div>
                  <span style={{ fontSize: "calc(14px * var(--pl-fs, 1))", fontWeight: 700, color: "var(--color-on-surface)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                    {formatInr(l.totalInr)}
                  </span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: "calc(12px * var(--pl-fs, 1))", margin: 0, color: "var(--color-on-surface-variant)", fontStyle: "italic" }}>
              {t.estDisclaimer}
            </p>
          </StepCard>
        </div>
      ) : (
        <div className="pl-loading">Loading…</div>
      )}
    </WizardShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
      <span style={{ fontSize: "calc(13px * var(--pl-fs, 1))", color: "var(--color-on-surface-variant)" }}>{label}</span>
      <span style={{ fontSize: "calc(14px * var(--pl-fs, 1))", fontWeight: 700, color: "var(--color-on-surface)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  tone,
  badge,
}: {
  icon: string;
  label: string;
  value: string;
  tone?: "ok" | "warn";
  badge?: string;
}) {
  const toneColor = tone === "warn" ? "#b45309" : tone === "ok" ? "#15803d" : "var(--color-primary-accent)";
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: 12,
        borderRadius: 12,
        background: "var(--color-surface-low)",
        border: "1px solid var(--color-surface-high)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <MaterialIcon name={icon} size={15} color={toneColor} />
        <span style={{ fontSize: "calc(12px * var(--pl-fs, 1))", fontWeight: 600, color: "var(--color-on-surface-variant)" }}>{label}</span>
      </div>
      <span style={{ fontSize: "calc(15px * var(--pl-fs, 1))", fontWeight: 800, color: "var(--color-on-surface)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
      {badge && <span style={{ fontSize: "calc(12px * var(--pl-fs, 1))", fontWeight: 700, color: toneColor }}>{badge}</span>}
    </div>
  );
}
