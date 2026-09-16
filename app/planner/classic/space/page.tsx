"use client";

import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/planner/shell/WizardShell";
import { ProgressBar } from "@/components/planner/shell/ProgressBar";
import { StepFooterCta } from "@/components/planner/sections/StepFooterCta";
import { NameSection } from "@/components/planner/sections/NameSection";
import { DimensionsSection } from "@/components/planner/sections/DimensionsSection";
import { DoorWindowSection } from "@/components/planner/sections/DoorWindowSection";
import { FixturesSection } from "@/components/planner/sections/FixturesSection";
import { FootprintPreview } from "@/components/planner/sections/FootprintPreview";
import { useI18n } from "@/lib/planner/i18n/provider";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";

export default function SpaceStepPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { ready } = useEnsureProject();

  return (
    <WizardShell
      subtitle={t.appSub}
      progress={<ProgressBar badge={t.stepBadge} step={1} total={6} />}
      // The live footprint sits beside the inputs, so every change is visible
      // without scrolling away from the field being edited.
      aside={ready ? <FootprintPreview /> : undefined}
      footer={
        <StepFooterCta
          label={t.s1CtaText}
          subLabel={t.s1CtaSub}
          onClick={() => router.push("/planner/style")}
          disabled={!ready}
        />
      }
    >
      {ready ? (
        <div className="pl-sections">
          <NameSection />
          <DimensionsSection />
          <DoorWindowSection />
          <FixturesSection />
        </div>
      ) : (
        <div className="pl-loading">Loading…</div>
      )}
    </WizardShell>
  );
}
