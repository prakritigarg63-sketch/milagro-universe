"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/planner/shell/WizardShell";
import { ProgressBar } from "@/components/planner/shell/ProgressBar";
import { StepFooterCta } from "@/components/planner/sections/StepFooterCta";
import { ProjectBriefSummary } from "@/components/planner/sections/ProjectBriefSummary";
import { BrandGuideSection } from "@/components/planner/sections/BrandGuideSection";
import { InviteExpert } from "@/components/planner/sections/InviteExpert";
import { MaterialIcon } from "@/components/planner/ui/MaterialIcon";
import { useI18n } from "@/lib/planner/i18n/provider";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { areaSqft, formatInr } from "@/lib/planner/units";

export default function BriefStepPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { ready } = useEnsureProject();
  const project = useProjectStore((s) => s.project);
  const generatePlan = useProjectStore((s) => s.generatePlan);
  const generateEstimate = useProjectStore((s) => s.generateEstimate);
  const finalize = useProjectStore((s) => s.finalize);
  const [toast, setToast] = useState<string | null>(null);

  // Ensure the brief is complete regardless of how the user got here.
  useEffect(() => {
    if (ready) {
      generatePlan();
      generateEstimate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  async function onShare() {
    if (!project) return;
    const sqft = areaSqft(project.room.lengthInches, project.room.widthInches);
    const total = project.estimate ? formatInr(project.estimate.totalCostInr) : "—";
    const days = project.estimate ? project.estimate.timeDays : "—";
    const text = `${project.room.name} — Milagro Universe plan\n${sqft} sq.ft · Est. ${total} · ~${days} days`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${project.room.name} — Milagro Universe`, text });
        return;
      }
    } catch {
      return; // user cancelled the share sheet
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard");
    } catch {
      showToast("Sharing not available");
    }
  }

  function onSave() {
    finalize();
    showToast(t.savedToast);
  }

  const loaded = ready && project;

  return (
    <WizardShell
      subtitle={t.appSub6}
      progress={<ProgressBar badge={t.step6Badge} step={6} total={6} icon="description" />}
      // What to do with the finished brief sits beside it.
      aside={
        loaded ? (
          <>
            <div className="no-print" style={{ display: "flex", gap: 8 }}>
              <ActionButton icon="print" label={t.printBrief} onClick={() => window.print()} />
              <ActionButton icon="share" label={t.shareBrief} onClick={onShare} />
            </div>
            <InviteExpert />
            <BrandGuideSection />
          </>
        ) : undefined
      }
      footer={
        <StepFooterCta
          label={t.saveToProfile}
          subLabel={t.finishSub}
          icon="check"
          onClick={onSave}
          onBack={() => router.push("/planner/estimate")}
          backLabel={t.backCta}
          disabled={!ready}
        />
      }
    >
      {loaded ? (
        <div className="pl-sections">
          <ProjectBriefSummary project={project} />
        </div>
      ) : (
        <div className="pl-loading">Loading…</div>
      )}

      {toast && (
        <div className="pl-toast no-print" role="status">
          <MaterialIcon name="verified" size={16} color="var(--color-primary-fixed-dim)" />
          <span>{toast}</span>
        </div>
      )}
    </WizardShell>
  );
}

function ActionButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        height: 44,
        borderRadius: 12,
        background: "var(--color-surface-lowest)",
        border: "1px solid var(--color-surface-high)",
        color: "var(--color-on-surface)",
        fontWeight: 700,
        fontSize: "calc(13px * var(--pl-fs, 1))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <MaterialIcon name={icon} size={18} color="var(--color-primary-accent)" />
      {label}
    </button>
  );
}
