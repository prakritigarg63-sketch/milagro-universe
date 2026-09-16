"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { PHASES, entryStepForPhase, phaseIndexOf, type PhaseId } from "@/lib/planner/studio/steps";

interface Props {
  /** Id of the step currently on screen. */
  stepId: string;
  /** Phases the user has already completed — these become clickable. */
  furthestPhaseIndex: number;
}

/**
 * The six-phase rail.
 *
 * This is the only progress the homeowner sees. Twelve steps happen underneath
 * it, but "Project → Space → Layout → Visualize → Style → Estimate" is a
 * journey, where "step 7 of 12" is a queue.
 *
 * Phases already reached are links — going back must never feel like losing
 * work, and nothing is discarded by revisiting a screen.
 */
export function JourneyNav({ stepId, furthestPhaseIndex }: Props) {
  const t = useT();
  const currentIndex = phaseIndexOf(stepId);

  return (
    <nav aria-label={t("Planner progress")} className="border-b border-hairline bg-surface">
      <ol className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-4 py-2.5 sm:gap-2 sm:px-6">
        {PHASES.map((phase, i) => {
          const state: "done" | "current" | "todo" =
            i < currentIndex ? "done" : i === currentIndex ? "current" : "todo";
          const reachable = i <= furthestPhaseIndex;

          return (
            <li key={phase.id} className="flex shrink-0 items-center gap-1 sm:gap-2">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`h-px w-4 sm:w-8 ${i <= currentIndex ? "bg-brand/50" : "bg-hairline"}`}
                />
              )}
              <PhaseChip
                phase={phase}
                state={state}
                reachable={reachable}
                label={t(phase.label)}
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function PhaseChip({
  phase,
  state,
  reachable,
  label,
}: {
  phase: { id: PhaseId; label: string; icon: Parameters<typeof Icon>[0]["name"] };
  state: "done" | "current" | "todo";
  reachable: boolean;
  label: string;
}) {
  // State is never carried by colour alone: the icon changes to a tick when a
  // phase is done, and aria-current names the one you are on.
  const base =
    "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors sm:px-3 sm:text-[13px]";
  const tone =
    state === "current"
      ? "bg-wash text-brand ring-1 ring-brand/35"
      : state === "done"
        ? "text-ink-soft hover:bg-wash"
        : "text-body-soft";

  const content = (
    <>
      <Icon name={state === "done" ? "check" : phase.icon} size={14} aria-hidden="true" />
      <span className={state === "current" ? "" : "max-sm:sr-only"}>{label}</span>
    </>
  );

  if (!reachable || state === "current") {
    return (
      <span
        className={`${base} ${tone}`}
        aria-current={state === "current" ? "step" : undefined}
        aria-disabled={!reachable || undefined}
      >
        {content}
      </span>
    );
  }

  return (
    <Link href={entryStepForPhase(phase.id).href} className={`${base} ${tone}`}>
      {content}
    </Link>
  );
}
