"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { useCanvasStore } from "@/lib/planner/studio/canvas-store";
import { StudioShell } from "@/components/planner/studio/StudioShell";
import { StepFooter } from "@/components/planner/studio/StepFooter";
import { DesignCanvas } from "@/components/planner/studio/DesignCanvas";
import { RoomView3D } from "@/components/planner/studio/RoomView3D";
import { feedbackForAll, worstLevel, type PlacementFeedback } from "@/lib/planner/studio/placement";
import {
  PALETTE,
  createPlaced,
  describePlaced,
  duplicatePlaced,
  movePlaced,
  rotatePlaced,
} from "@/lib/planner/studio/fixtures";
import { formatFixtureLength, formatLength, type LengthUnit } from "@/lib/planner/studio/measure";

/**
 * Screen 5 — the interactive planner.
 *
 * Opens on the layout the homeowner chose, never on an empty room. Everything
 * here is a modification of something that already works, which is the whole
 * difference between "design your bathroom" and "tell us about your space".
 */
export default function DesignPage() {
  const t = useT();
  const { project } = useEnsureProject();
  const resetPlacedFixtures = useProjectStore((s) => s.resetPlacedFixtures);

  const selectedIndex = useCanvasStore((s) => s.selectedIndex);
  const select = useCanvasStore((s) => s.select);
  const commit = useCanvasStore((s) => s.commit);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const clearHistory = useCanvasStore((s) => s.clearHistory);
  const pastLength = useCanvasStore((s) => s.past.length);
  const futureLength = useCanvasStore((s) => s.future.length);

  const [view, setView] = useState<"2d" | "3d">("2d");
  const [unit] = useState<LengthUnit>("ft");

  const room = project?.room;
  const fixtures = useMemo(
    () => project?.placedFixtures ?? project?.plan?.fixtures ?? [],
    [project?.placedFixtures, project?.plan?.fixtures],
  );

  const feedback = useMemo(
    () => (room ? feedbackForAll(fixtures, room) : []),
    [fixtures, room],
  );

  // Delete/duplicate from the keyboard, where the selection already lives.
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (selectedIndex === null) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        commit(fixtures.filter((_, i) => i !== selectedIndex));
        select(null);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedIndex, fixtures, commit, select, undo, redo]);

  if (!room) {
    return (
      <StudioShell stepId="design" footer={<StepFooter stepId="design" />}>
        <span />
      </StudioShell>
    );
  }

  const selected = selectedIndex !== null ? fixtures[selectedIndex] : null;
  const selectedFeedback = selectedIndex !== null ? feedback[selectedIndex] : null;
  const overall = worstLevel(feedback);

  function add(itemId: string) {
    const item = PALETTE.find((p) => p.id === itemId);
    if (!item || !room) return;
    commit([...fixtures, createPlaced(item, room)]);
    select(fixtures.length);
  }

  return (
    <StudioShell
      stepId="design"
      bleed
      footer={
        <StepFooter
          stepId="design"
          blockedReason={
            overall === "conflict" ? t("Resolve the highlighted conflicts to continue") : null
          }
        />
      }
    >
      <div className="mx-auto grid w-full max-w-[1600px] gap-0 px-0 lg:grid-cols-[228px_minmax(0,1fr)_288px]">
        {/* ── Fixtures ─────────────────────────────────────────────── */}
        <aside className="border-hairline lg:border-r lg:py-6">
          <h2 className="px-4 pb-2 pt-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-body-soft lg:pt-0">
            {t("Fixtures")}
          </h2>
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:grid lg:grid-cols-1 lg:gap-1.5 lg:overflow-visible lg:pb-0">
            {PALETTE.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => add(item.id)}
                className="flex min-w-[148px] items-center gap-2.5 rounded-xl border border-hairline
                           bg-surface-raised px-3 py-2.5 text-left transition-colors
                           hover:border-brand/45 hover:bg-wash lg:min-w-0"
              >
                <Icon name={item.icon} size={17} className="shrink-0 text-body-soft" />
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium text-ink">
                    {t(item.label)}
                  </span>
                  <span className="block truncate text-[11.5px] text-body-soft">{t(item.hint)}</span>
                </span>
                <Icon name="plus" size={14} className="ml-auto shrink-0 text-brand" />
              </button>
            ))}
          </div>
        </aside>

        {/* ── Canvas ───────────────────────────────────────────────── */}
        <section className="min-w-0 px-4 py-5 lg:px-6 lg:py-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div role="group" aria-label={t("View")} className="flex rounded-pill border border-hairline bg-surface-raised p-0.5">
              {(["2d", "3d"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={[
                    "rounded-pill px-3.5 py-1.5 text-[12.5px] font-semibold uppercase transition-colors",
                    view === v ? "bg-brand text-on-brand" : "text-body hover:text-ink",
                  ].join(" ")}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <ToolButton label={t("Undo")} icon="undo" disabled={pastLength === 0} onClick={undo} />
              <ToolButton label={t("Redo")} icon="redo" disabled={futureLength === 0} onClick={redo} />
              <button
                type="button"
                onClick={() => {
                  resetPlacedFixtures();
                  clearHistory();
                }}
                className="h-9 rounded-pill border border-hairline bg-surface-raised px-3.5 text-[12.5px]
                           font-semibold text-body transition-colors hover:border-brand/45 hover:text-ink"
              >
                {t("Reset layout")}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-raised p-4 sm:p-6">
            {view === "2d" ? (
              <DesignCanvas
                room={room}
                unit={unit}
                fixtures={fixtures}
                feedback={feedback}
                selectedIndex={selectedIndex}
                doorDetail={project.doorDetail}
                extraOpenings={project.extraOpenings}
                plumbing={project.plumbing}
                onSelect={select}
                onMove={(index, x, y) =>
                  commit(
                    fixtures.map((f, i) => (i === index ? movePlaced(f, x, y, room) : f)),
                  )
                }
              />
            ) : (
              <RoomView3D room={room} fixtures={fixtures} selectedIndex={selectedIndex} />
            )}
          </div>

          <OverallStatus level={overall} t={t} />
        </section>

        {/* ── Details ──────────────────────────────────────────────── */}
        <aside className="border-hairline px-4 py-5 lg:border-l lg:py-6">
          <h2 className="pb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-body-soft">
            {t("Details")}
          </h2>

          {!selected || !selectedFeedback ? (
            <p className="rounded-xl border border-dashed border-hairline px-4 py-6 text-center text-[13px] leading-relaxed text-body-soft">
              {t("Select a fixture on the plan to see its size and placement.")}
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-body-soft">
                  {t("Selected")}
                </span>
                <p className="mt-0.5 text-[16px] font-semibold text-ink">
                  {t(describePlaced(selected))}
                </p>
              </div>

              <DetailRow
                label={t("Dimensions")}
                value={`${formatFixtureLength(selected.widthInches, unit)} × ${formatFixtureLength(selected.depthInches, unit)}`}
              />
              <DetailRow
                label={t("Position")}
                value={`${formatLength(selected.x, unit)}, ${formatLength(selected.y, unit)}`}
              />

              <FeedbackCard feedback={selectedFeedback} t={t} />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <ActionButton
                  label={t("Rotate")}
                  icon="swap"
                  onClick={() =>
                    commit(
                      fixtures.map((f, i) => (i === selectedIndex ? rotatePlaced(f, room) : f)),
                    )
                  }
                />
                <ActionButton
                  label={t("Duplicate")}
                  icon="layers"
                  onClick={() => {
                    commit([...fixtures, duplicatePlaced(selected, room)]);
                    select(fixtures.length);
                  }}
                />
                <ActionButton
                  label={t("Replace")}
                  icon="cart"
                  onClick={() => select(null)}
                  hint={t("Choose another from the Fixtures list")}
                />
                <ActionButton
                  label={t("Remove")}
                  icon="close"
                  danger
                  onClick={() => {
                    commit(fixtures.filter((_, i) => i !== selectedIndex));
                    select(null);
                  }}
                />
              </div>
            </div>
          )}

          <p className="mt-6 text-[11.5px] leading-relaxed text-body-soft">
            {t("Tip: select a fixture and use the arrow keys to nudge it. Hold Shift for a foot.")}
          </p>
        </aside>
      </div>
    </StudioShell>
  );
}

function ToolButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline
                 bg-surface-raised text-body transition-colors hover:border-brand/45 hover:text-ink
                 disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon name={icon} size={15} />
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-hairline pb-2">
      <span className="text-[12.5px] text-body-soft">{label}</span>
      <span className="text-right text-[13.5px] font-medium text-ink">{value}</span>
    </div>
  );
}

const LEVEL_STYLE: Record<PlacementFeedback["level"], { box: string; icon: Parameters<typeof Icon>[0]["name"] }> = {
  comfortable: { box: "border-brand/30 bg-wash", icon: "check" },
  tight: { box: "border-[#b8801f]/35 bg-[#b8801f]/8", icon: "warning" },
  conflict: { box: "border-danger/35 bg-danger/8", icon: "warning" },
};

function FeedbackCard({ feedback, t }: { feedback: PlacementFeedback; t: (s: string) => string }) {
  const style = LEVEL_STYLE[feedback.level];
  return (
    <div className={`rounded-xl border px-3.5 py-3 ${style.box}`} role="status">
      <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
        <Icon name={style.icon} size={14} />
        {t(feedback.title)}
      </p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-body">{t(feedback.detail)}</p>
    </div>
  );
}

function OverallStatus({
  level,
  t,
}: {
  level: PlacementFeedback["level"];
  t: (s: string) => string;
}) {
  const copy = {
    comfortable: "Everything has comfortable clearance.",
    tight: "One or more fixtures are a little tight — marked △ on the plan.",
    conflict: "Something overlaps — marked ! on the plan.",
  }[level];
  return (
    <p className="mt-3 flex items-center gap-1.5 text-[13px] text-body" role="status">
      <Icon name={level === "comfortable" ? "check" : "warning"} size={14} className="shrink-0" />
      {t(copy)}
    </p>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  danger = false,
  hint,
}: {
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
  onClick: () => void;
  danger?: boolean;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={[
        "flex h-10 items-center justify-center gap-1.5 rounded-xl border text-[13px] font-semibold transition-colors",
        danger
          ? "border-hairline bg-surface-raised text-body hover:border-danger/50 hover:text-danger"
          : "border-hairline bg-surface-raised text-ink hover:border-brand/45 hover:bg-wash",
      ].join(" ")}
    >
      <Icon name={icon} size={14} />
      {label}
    </button>
  );
}
