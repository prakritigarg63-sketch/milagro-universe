"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { useStudioStore } from "@/lib/planner/studio/studio-store";
import { phaseIndexOf, STEPS } from "@/lib/planner/studio/steps";
import { useAuth } from "@/components/auth/AuthProvider";
import { useT } from "@/lib/i18n/useT";
import { StudioHeader } from "./StudioHeader";
import { JourneyNav } from "./JourneyNav";
import { SaveGate } from "./SaveGate";

interface Props {
  stepId: string;
  /** Usually a <StepFooter>. Pinned below the content. */
  footer?: ReactNode;
  /** Opt out of the centred column for full-bleed screens (canvas, 3D). */
  bleed?: boolean;
  children: ReactNode;
}

/**
 * The frame every studio screen sits in: header, phase rail, content, footer.
 *
 * It also owns the two things that must behave identically on all twelve
 * screens — remembering how far the user has come, and what "Save" means when
 * nobody is signed in.
 */
export function StudioShell({ stepId, footer, bleed = false, children }: Props) {
  const t = useT();
  const { user } = useAuth();
  const { project } = useEnsureProject();
  const setRoomName = useProjectStore((s) => s.setRoomName);

  const furthestStepIndex = useStudioStore((s) => s.furthestStepIndex);
  const reachStep = useStudioStore((s) => s.reachStep);
  const hydrateFurthest = useStudioStore((s) => s.hydrateFurthest);
  const openSaveGate = useStudioStore((s) => s.openSaveGate);

  const [savedLabel, setSavedLabel] = useState<string | null>(null);

  const projectId = project?.id ?? null;

  useEffect(() => {
    hydrateFurthest(projectId);
  }, [projectId, hydrateFurthest]);

  useEffect(() => {
    reachStep(projectId, stepId);
  }, [projectId, stepId, reachStep]);

  // The store already write-throughs on every change, so an explicit Save is
  // reassurance for a signed-in user and the account prompt for everyone else.
  function handleSave() {
    if (!user) {
      openSaveGate("save");
      return;
    }
    setSavedLabel(t("Saved"));
    window.setTimeout(() => setSavedLabel(null), 2200);
  }

  const furthestPhaseIndex = phaseIndexOf(
    STEPS[Math.min(furthestStepIndex, STEPS.length - 1)]?.id ?? stepId,
  );

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <StudioHeader
        projectName={project?.room.name ?? t("My Bathroom")}
        onRenameProject={setRoomName}
        onSave={handleSave}
        savedLabel={savedLabel}
      />
      <JourneyNav stepId={stepId} furthestPhaseIndex={furthestPhaseIndex} />

      <main className={bleed ? "flex-1" : "mx-auto w-full max-w-[1100px] flex-1 px-4 py-10 sm:px-6 sm:py-14"}>
        {project ? children : <LoadingSkeleton label={t("Opening your plan…")} bleed={bleed} />}
      </main>

      {/* Held back until there is something to act on: a disabled Continue bar
          above an empty page reads as broken, not as loading. */}
      {project ? footer : null}
      <SaveGate />
    </div>
  );
}

/**
 * The shape of a studio screen, not a spinner.
 *
 * Every step opens with a heading, a line of support copy and a panel, so the
 * skeleton is those three things. It holds the layout still while the project
 * loads instead of collapsing and then jumping.
 */
function LoadingSkeleton({ label, bleed }: { label: string; bleed: boolean }) {
  return (
    <div
      className={bleed ? "mx-auto w-full max-w-[1600px] px-4 pt-8 sm:px-6" : ""}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="h-9 w-2/3 max-w-sm rounded-lg bg-field" />
        <div className="mt-4 h-4 w-full max-w-md rounded bg-field/70" />
        <div className="mt-9 h-64 w-full rounded-2xl border border-hairline bg-field/40 sm:h-80" />
      </div>
    </div>
  );
}
