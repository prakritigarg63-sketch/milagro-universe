"use client";

import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { prevStep, nextStep } from "@/lib/planner/studio/steps";

interface Props {
  stepId: string;
  /** Label override for the forward button (e.g. "See my layouts"). */
  continueLabel?: string;
  /** Blocks forward movement; the reason is shown beside the button. */
  blockedReason?: string | null;
  /** Runs before navigating. Return false to stay put. */
  onContinue?: () => boolean | void;
  /** Replaces the forward navigation entirely (final step, custom targets). */
  continueOverride?: () => void;
}

/**
 * Back / Continue, pinned to the bottom of every studio screen.
 *
 * Both directions are ordinary navigation — going back re-renders a screen with
 * its saved answers intact, because the project, not the page, holds the state.
 */
export function StepFooter({
  stepId,
  continueLabel,
  blockedReason = null,
  onContinue,
  continueOverride,
}: Props) {
  const t = useT();
  const router = useRouter();
  const back = prevStep(stepId);
  const forward = nextStep(stepId);
  // Nothing further has been built yet. Say so rather than moving the user to
  // a route that does not exist.
  const dead = !forward && !continueOverride;
  const blocked = Boolean(blockedReason) || dead;

  function handleContinue() {
    if (blocked) return;
    if (onContinue?.() === false) return;
    if (continueOverride) {
      continueOverride();
      return;
    }
    if (forward) router.push(forward.href);
  }

  return (
    <div className="sticky bottom-0 z-30 border-t border-hairline bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
        {back ? (
          <button
            type="button"
            onClick={() => router.push(back.href)}
            className="inline-flex h-11 items-center gap-1.5 rounded-pill px-4 text-sm font-semibold
                       text-body transition-colors hover:bg-wash hover:text-ink"
          >
            <Icon name="arrowRight" size={16} className="rotate-180" />
            {t("Back")}
          </button>
        ) : (
          <span />
        )}

        <div className="ml-auto flex items-center gap-3">
          {(blockedReason || dead) && (
            <span className="text-right text-[12.5px] text-body-soft" role="status">
              {blockedReason ?? "More of the planner is on the way."}
            </span>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={blocked}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-pill bg-clay px-6
                       text-sm font-semibold text-on-clay shadow-[0_6px_18px_rgb(154_106_67/0.30)]
                       transition-[transform,background-color] duration-200 hover:-translate-y-px
                       hover:bg-clay-dark motion-reduce:hover:translate-y-0
                       disabled:pointer-events-none disabled:opacity-45"
          >
            {continueLabel ?? t("Continue")}
            <Icon
              name="arrowRight"
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
