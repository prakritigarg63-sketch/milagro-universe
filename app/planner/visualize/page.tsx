"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { StudioShell } from "@/components/planner/studio/StudioShell";
import { StepFooter } from "@/components/planner/studio/StepFooter";
import { RoomPlan } from "@/components/planner/studio/RoomPlan";
import { Room3DWebGL } from "@/components/planner/studio/Room3DWebGL";
import { FINISH_GROUPS, optionFor } from "@/lib/planner/studio/finishes";
import type { FinishSurface, Finishes } from "@/lib/planner/types";

/**
 * Screen 6 — see it before you build it.
 *
 * The same plan, rendered. Changing a tile has to change the picture straight
 * away or the screen is a brochure; every control here writes to the project
 * and the view re-reads it, so there is one source of truth for what the
 * bathroom looks like.
 */
export default function VisualizePage() {
  const t = useT();
  const { project } = useEnsureProject();
  const setFinish = useProjectStore((s) => s.setFinish);

  const [view, setView] = useState<"2d" | "3d">("3d");
  const [openSurface, setOpenSurface] = useState<FinishSurface | null>(null);
  const [showBefore, setShowBefore] = useState(false);

  const room = project?.room;
  const fixtures = project?.placedFixtures ?? project?.plan?.fixtures ?? [];
  const finishes: Finishes = useMemo(() => project?.finishes ?? {}, [project?.finishes]);

  /** Chosen finishes → the colours the view renders with. */
  const isRenovation = project?.projectType === "renovation";
  const chosenCount = Object.keys(finishes).length;
  const openGroup = FINISH_GROUPS.find((g) => g.surface === openSurface) ?? null;

  return (
    <StudioShell stepId="visualize" footer={<StepFooter stepId="visualize" />}>
      <header className="max-w-2xl">
        <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[38px]">
          {t("See it before you build it.")}
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-body">
          {t("Try finishes on your own layout. Nothing here changes the plan you made.")}
        </p>
      </header>

      {room && (
        <>
          {/* ── View controls ────────────────────────────────────────── */}
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <div role="group" aria-label={t("View")} className="flex rounded-pill border border-hairline bg-surface-raised p-0.5">
              <ViewTab active={view === "2d"} onClick={() => setView("2d")} label={t("2D Plan")} />
              <ViewTab active={view === "3d"} onClick={() => setView("3d")} label={t("3D View")} />
            </div>

            {isRenovation && (
              <button
                type="button"
                onClick={() => setShowBefore((v) => !v)}
                aria-pressed={showBefore}
                className={[
                  "inline-flex h-10 items-center gap-1.5 rounded-pill border px-4 text-[13px] font-semibold transition-colors",
                  showBefore
                    ? "border-brand bg-wash text-brand"
                    : "border-hairline bg-surface-raised text-ink hover:border-brand/45",
                ].join(" ")}
              >
                <Icon name="swap" size={15} />
                {showBefore ? t("Showing: Before") : t("Show before")}
              </button>
            )}

            <span className="ml-auto text-[12.5px] text-body-soft">
              {chosenCount
                ? `${chosenCount} ${t("finishes chosen")}`
                : t("No finishes chosen yet")}
            </span>
          </div>

          {/* ── The room ─────────────────────────────────────────────── */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-surface-raised p-5 sm:p-8">
            {view === "3d" ? (
              <Room3DWebGL project={project} bare={showBefore} />
            ) : (
              <RoomPlan
                room={room}
                unit="ft"
                placed={fixtures}
                doorDetail={project.doorDetail}
                extraOpenings={project.extraOpenings}
                plumbing={project.plumbing}
                ariaLabel={t("2D plan of your bathroom")}
              />
            )}
            {showBefore && (
              <p className="mt-4 text-center text-[13px] text-body-soft" role="status">
                {t("Before — your existing bathroom, without the new finishes.")}
              </p>
            )}
          </div>

          {/* ── Finish toolbar ───────────────────────────────────────── */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {FINISH_GROUPS.map((group) => {
              const chosen = optionFor(group.surface, finishes[group.surface]);
              const active = openSurface === group.surface;
              return (
                <button
                  key={group.surface}
                  type="button"
                  onClick={() => setOpenSurface(active ? null : group.surface)}
                  aria-expanded={active}
                  className={[
                    "flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                    active
                      ? "border-brand bg-wash"
                      : "border-hairline bg-surface-raised hover:border-brand/45",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className="h-6 w-6 shrink-0 rounded-md border border-hairline"
                    style={{ background: chosen?.color ?? "var(--color-field)" }}
                  />
                  <span>
                    <span className="block text-[13px] font-semibold text-ink">
                      {t(group.label)}
                    </span>
                    <span className="block text-[11.5px] text-body-soft">
                      {chosen ? t(chosen.label) : t("Not chosen")}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Option panel ─────────────────────────────────────────── */}
          {openGroup && (
            <section className="mt-4 rounded-2xl border border-hairline bg-surface-raised p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-semibold text-ink">{t(openGroup.prompt)}</h2>
                <button
                  type="button"
                  onClick={() => setOpenSurface(null)}
                  aria-label={t("Close")}
                  className="-m-2 rounded-full p-2 text-body-soft transition-colors hover:bg-wash hover:text-ink"
                >
                  <Icon name="close" size={17} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {openGroup.options.map((option) => {
                  const active = finishes[openGroup.surface] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFinish(openGroup.surface, option.id)}
                      aria-pressed={active}
                      className={[
                        "overflow-hidden rounded-xl border text-left transition-[border-color,transform]",
                        "hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
                        active ? "border-brand" : "border-hairline hover:border-brand/45",
                      ].join(" ")}
                    >
                      <span
                        className="relative block h-14 w-full"
                        style={{
                          background: `linear-gradient(135deg, ${option.color} 0%, ${option.color} 58%, ${option.accent} 58%, ${option.accent} 100%)`,
                        }}
                      >
                        {active && (
                          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-on-brand">
                            <Icon name="check" size={12} />
                          </span>
                        )}
                      </span>
                      <span className="block px-2.5 py-2">
                        <span className="block text-[12.5px] font-semibold text-ink">
                          {t(option.label)}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-body-soft">
                          {t(option.note)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-[12px] leading-relaxed text-body-soft">
                {t(
                  "Colours are representative for planning. Tile and paint vary between batches and screens — check a physical sample before ordering.",
                )}
              </p>
            </section>
          )}
        </>
      )}
    </StudioShell>
  );
}

function ViewTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-pill px-4 py-1.5 text-[13px] font-semibold transition-colors",
        active ? "bg-brand text-on-brand" : "text-body hover:text-ink",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
