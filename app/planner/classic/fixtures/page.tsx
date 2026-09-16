"use client";

import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/planner/shell/WizardShell";
import { ProgressBar } from "@/components/planner/shell/ProgressBar";
import { StepFooterCta } from "@/components/planner/sections/StepFooterCta";
import { FixtureSpecsSection } from "@/components/planner/sections/FixtureSpecsSection";
import { AddOnsSection } from "@/components/planner/sections/AddOnsSection";
import { useI18n } from "@/lib/planner/i18n/provider";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";

export default function FixturesStepPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { ready } = useEnsureProject();

  return (
    <WizardShell
      subtitle={t.appSub3}
      progress={<ProgressBar badge={t.step3Badge} step={3} total={6} icon="grid_view" />}
      footer={
        <StepFooterCta
          label={t.s3CtaText}
          subLabel={t.s3CtaSub}
          onClick={() => router.push("/planner/plan")}
          onBack={() => router.push("/planner/style")}
          backLabel={t.backCta}
          disabled={!ready}
        />
      }
    >
      {ready ? (
        <div className="pl-sections">
          <FixtureSpecsSection />
          <AddOnsSection />
        </div>
      ) : (
        <div className="pl-loading">Loading…</div>
      )}
    </WizardShell>
  );
}
