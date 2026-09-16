"use client";

import Image from "next/image";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { StudioShell } from "@/components/planner/studio/StudioShell";
import { StepFooter } from "@/components/planner/studio/StepFooter";
import { RoomView3D, type ViewPalette } from "@/components/planner/studio/RoomView3D";
import {
  STYLE_CARDS,
  STYLE_PRESETS,
  architectureForDirection,
  optionFor,
} from "@/lib/planner/studio/finishes";
import type { Finishes, StyleDirection } from "@/lib/planner/types";

/**
 * Screen 7 — what should it feel like?
 *
 * Asked after the layout, not before: it is far easier to say "that one" about
 * your own room than about an empty idea. Choosing a direction seeds a coherent
 * set of finishes and updates the preview immediately, so the answer is visible
 * rather than theoretical.
 */
export default function StylePage() {
  const t = useT();
  const { project } = useEnsureProject();
  const setStyleDirection = useProjectStore((s) => s.setStyleDirection);
  const setArchitecture = useProjectStore((s) => s.setArchitecture);

  const room = project?.room;
  const fixtures = project?.placedFixtures ?? project?.plan?.fixtures ?? [];
  const selected = project?.styleDirection ?? null;
  const finishes: Finishes = project?.finishes ?? {};

  const palette: ViewPalette = {
    floor: optionFor("floor", finishes.floor)?.color,
    floorAccent: optionFor("floor", finishes.floor)?.accent,
    walls: optionFor("walls", finishes.walls)?.color,
    wallsAccent: optionFor("walls", finishes.walls)?.accent,
    vanity: optionFor("vanity", finishes.vanity)?.color,
    shower: optionFor("shower", finishes.shower)?.color,
    wc: optionFor("wc", finishes.wc)?.color,
    almirah: optionFor("vanity", finishes.vanity)?.accent,
    light: optionFor("lighting", finishes.lighting)?.color,
  };

  function choose(id: StyleDirection) {
    setStyleDirection(id, STYLE_PRESETS[id]);
    // Keep the estimate engine's structural style in step with the visual one.
    setArchitecture(architectureForDirection(id));
  }

  return (
    <StudioShell
      stepId="style"
      footer={
        <StepFooter
          stepId="style"
          blockedReason={selected ? null : t("Choose a direction to continue")}
        />
      }
    >
      <header className="max-w-2xl">
        <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[38px]">
          {t("What should your bathroom feel like?")}
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-body">
          {t("Choose a direction. You can change everything later.")}
        </p>
      </header>

      <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-10">
        <div className="grid gap-4 sm:grid-cols-2">
          {STYLE_CARDS.map((card) => {
            const active = selected === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => choose(card.id)}
                aria-pressed={active}
                className={[
                  "group overflow-hidden rounded-2xl border text-left transition-[border-color,transform,box-shadow] duration-200",
                  "hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
                  active
                    ? "border-brand shadow-[0_10px_30px_rgb(7_140_200/0.15)]"
                    : "border-hairline hover:border-brand/45",
                  "bg-surface-raised",
                ].join(" ")}
              >
                <span className="relative block aspect-[16/10] w-full overflow-hidden bg-wash">
                  <Image
                    src={card.photo}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                  />
                  {active && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill bg-brand px-2.5 py-1 text-[11.5px] font-semibold text-on-brand">
                      <Icon name="check" size={13} />
                      {t("Selected")}
                    </span>
                  )}
                </span>
                <span className="block p-4">
                  <span className="block text-[17px] font-semibold text-ink">{t(card.label)}</span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {card.traits.map((trait) => (
                      <span
                        key={trait}
                        className="rounded-pill bg-wash px-2.5 py-1 text-[11.5px] font-medium text-body"
                      >
                        {t(trait)}
                      </span>
                    ))}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Live preview — the answer to "what does that mean for my room?" */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-raised p-5">
            {room && (
              <RoomView3D
                room={room}
                fixtures={fixtures}
                selectedIndex={null}
                doorDetail={project?.doorDetail}
                palette={palette}
                showcase
              />
            )}
          </div>
          <p className="mt-3 text-center text-[12.5px] text-body-soft">
            {selected
              ? t("Your room, in this direction. Fine-tune every surface on Visualize.")
              : t("Choose a direction to see it applied to your room.")}
          </p>
        </aside>
      </div>
    </StudioShell>
  );
}
