"use client";

import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useProjectStore } from "@/lib/planner/store/project-store";
import type { PlumbingIntent } from "@/lib/planner/types";

const OPTIONS: { id: PlumbingIntent; label: string; hint: string }[] = [
  {
    id: "keepExisting",
    label: "Keep existing plumbing",
    hint: "Work around the outlets that are already there.",
  },
  {
    id: "openToMoving",
    label: "Open to moving plumbing",
    hint: "Best layout first; we’ll show what it involves.",
  },
  { id: "notSure", label: "Not sure yet", hint: "Decide once you’ve seen the options." },
];

/**
 * The renovation-only question, shown prominently because it is the single
 * biggest lever on what a bathroom renovation costs.
 *
 * Carefully not advice: it states the general relationship and stops there. A
 * planning tool that implies engineering sign-off is a planning tool that gets
 * someone's floor dug up on its say-so.
 */
export function PlumbingIntentCard() {
  const t = useT();
  const intent = useProjectStore((s) => s.project?.plumbingIntent ?? null);
  const setPlumbingIntent = useProjectStore((s) => s.setPlumbingIntent);

  return (
    <section className="mt-8 rounded-2xl border border-brand/30 bg-wash p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-raised">
          <Icon name="pipe" size={18} className="text-brand" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold leading-snug text-ink">
            {t("Which plumbing points do you want to keep?")}
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-body">
            {t("Keeping existing plumbing can significantly reduce renovation work.")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const active = intent === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setPlumbingIntent(option.id)}
              aria-pressed={active}
              className={[
                "rounded-xl border px-4 py-3.5 text-left transition-colors",
                active
                  ? "border-brand bg-surface-raised shadow-[0_4px_14px_rgb(7_140_200/0.12)]"
                  : "border-hairline bg-surface-raised hover:border-brand/45",
              ].join(" ")}
            >
              <span className="flex items-center gap-1.5">
                {active && <Icon name="check" size={14} className="shrink-0 text-brand" />}
                <span className="text-[14px] font-semibold text-ink">{t(option.label)}</span>
              </span>
              <span className="mt-1 block text-[12.5px] leading-relaxed text-body-soft">
                {t(option.hint)}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-body-soft">
        {t(
          "A general guide, not professional advice — your plumber or contractor should confirm what’s possible on site.",
        )}
      </p>
    </section>
  );
}
