"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/planner/shell/WizardShell";
import { ProgressBar } from "@/components/planner/shell/ProgressBar";
import { StepFooterCta } from "@/components/planner/sections/StepFooterCta";
import { StepCard } from "@/components/planner/ui/StepCard";
import { MaterialIcon } from "@/components/planner/ui/MaterialIcon";
import { Plan4DViewer } from "@/components/planner/plan3d/Plan4DViewer";
import { StyleInspiration } from "@/components/planner/sections/StyleInspiration";
import { useI18n } from "@/lib/planner/i18n/provider";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { useProjectStore } from "@/lib/planner/store/project-store";
import type { ClearanceWarning } from "@/lib/planner/types";

export default function PlanStepPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { ready } = useEnsureProject();
  const project = useProjectStore((s) => s.project);
  const generatePlan = useProjectStore((s) => s.generatePlan);

  // Generate from the current inputs whenever the plan step is opened.
  useEffect(() => {
    if (ready) generatePlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const plan = project?.plan ?? null;
  const loaded = ready && project && plan;

  return (
    <WizardShell
      subtitle={t.appSub4}
      progress={<ProgressBar badge={t.step4Badge} step={4} total={6} icon="view_in_ar" />}
      footer={
        <StepFooterCta
          label={t.s4CtaText}
          subLabel={t.s4CtaSub}
          onClick={() => router.push("/planner/estimate")}
          onBack={() => router.push("/planner/fixtures")}
          backLabel={t.backCta}
          disabled={!ready}
        />
      }
    >
      {loaded ? (
        <div className="pl-sections">
          {/* The 4D plan spans both columns; the checks and inspiration pair up below it. */}
          <StepCard style={{ display: "flex", flexDirection: "column", gap: 12, gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MaterialIcon name="view_in_ar" size={20} color="var(--color-primary-accent)" />
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: "calc(17px * var(--pl-fs, 1))", margin: 0, color: "var(--color-on-surface)" }}>
                    {t.plan4dTitle}
                  </h2>
                  <p style={{ fontSize: "calc(12px * var(--pl-fs, 1))", margin: 0, color: "var(--color-on-surface-variant)" }}>
                    {t.plan4dSub}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => generatePlan()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  height: 36,
                  padding: "0 12px",
                  borderRadius: 999,
                  background: "var(--color-surface-low)",
                  border: "1px solid var(--color-surface-high)",
                  color: "var(--color-primary-accent)",
                  fontWeight: 700,
                  fontSize: "calc(12px * var(--pl-fs, 1))",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <MaterialIcon name="refresh" size={15} color="var(--color-primary-accent)" />
                {t.regenerate}
              </button>
            </div>

            <Plan4DViewer project={project} plan={plan} />
          </StepCard>

          <StepCard style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MaterialIcon name="rule" size={20} color="var(--color-primary-accent)" />
                <h2 style={{ fontWeight: 700, fontSize: "calc(17px * var(--pl-fs, 1))", margin: 0, color: "var(--color-on-surface)" }}>
                  {t.clearancesTitle}
                </h2>
              </div>
              {plan.warnings.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-on-surface-variant)", fontSize: "calc(13px * var(--pl-fs, 1))" }}>
                  <MaterialIcon name="check_circle" size={18} color="#16a34a" />
                  <span>{t.allClear}</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {plan.warnings.map((w, i) => (
                    <WarningRow key={i} warning={w} />
                  ))}
                </div>
              )}
            </StepCard>

          <StyleInspiration />
        </div>
      ) : (
        <div className="pl-loading">Loading…</div>
      )}
    </WizardShell>
  );
}

function WarningRow({ warning }: { warning: ClearanceWarning }) {
  const isError = warning.severity === "error";
  const color = isError ? "#dc2626" : "#d97706";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: 10,
        borderRadius: 12,
        background: isError ? "rgba(220,38,38,0.08)" : "rgba(217,119,6,0.08)",
        border: `1px solid ${isError ? "rgba(220,38,38,0.25)" : "rgba(217,119,6,0.25)"}`,
      }}
    >
      <MaterialIcon name={isError ? "error" : "warning"} size={18} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: "calc(13px * var(--pl-fs, 1))", color: "var(--color-on-surface)", lineHeight: 1.4 }}>{warning.message}</span>
    </div>
  );
}
