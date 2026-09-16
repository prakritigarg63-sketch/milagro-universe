"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { StudioShell } from "@/components/planner/studio/StudioShell";
import { StepFooter } from "@/components/planner/studio/StepFooter";
import { RoomPlan } from "@/components/planner/studio/RoomPlan";
import {
  buildLayoutOptions,
  GENERATING_MESSAGES,
  type LayoutOption,
} from "@/lib/planner/studio/layouts";
import { nextStep } from "@/lib/planner/studio/steps";
import type { LayoutOptionId } from "@/lib/planner/types";

/** Total time spent on the generating sequence. Short: this is a real
 *  computation that takes microseconds, and pretending otherwise is theatre. */
const MESSAGE_MS = 550;

/**
 * Screen 4 — three layouts that work for this space.
 *
 * The most important screen in the studio. Dropping a homeowner into an empty
 * drag-and-drop canvas asks them to already know what a good bathroom looks
 * like; showing three worked options and letting them react asks only what they
 * prefer. Everything downstream is a modification of one of these.
 */
export default function LayoutsPage() {
  const t = useT();
  const router = useRouter();
  const { project } = useEnsureProject();
  const chooseLayout = useProjectStore((s) => s.chooseLayout);

  // Keyed on the inputs that change the plans. Deriving "generating" from a
  // marker rather than resetting a flag keeps every setState inside a timer
  // callback, so the effect never cascades a render.
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [compareOpen, setCompareOpen] = useState(false);
  const [previewId, setPreviewId] = useState<LayoutOptionId | null>(null);

  const room = project?.room;
  const options = useMemo(() => (room ? buildLayoutOptions(room) : []), [room]);
  const selectedId = project?.selectedLayoutId ?? null;

  const roomKey = room ? `${room.lengthInches}x${room.widthInches}x${room.door.wall}` : "";
  const generating = Boolean(room) && readyFor !== roomKey;

  // Cycle the messages once, then reveal. Re-runs only when the room changes.
  useEffect(() => {
    if (!room || readyFor === roomKey) return;
    const timers = GENERATING_MESSAGES.map((_, i) =>
      window.setTimeout(() => setMessageIndex(i), i * MESSAGE_MS),
    );
    const done = window.setTimeout(
      () => setReadyFor(roomKey),
      GENERATING_MESSAGES.length * MESSAGE_MS,
    );
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(done);
    };
  }, [room, roomKey, readyFor]);

  function choose(option: LayoutOption, advance: boolean) {
    chooseLayout(option.id, option.fixtures, option.plan);
    if (advance) {
      const forward = nextStep("layouts");
      if (forward) router.push(forward.href);
    }
  }

  const preview = options.find((o) => o.id === previewId) ?? null;

  return (
    <StudioShell
      stepId="layouts"
      footer={
        <StepFooter
          stepId="layouts"
          continueLabel={t("Open the planner")}
          blockedReason={selectedId ? null : t("Choose a layout to continue")}
        />
      }
    >
      {generating ? (
        <GeneratingState message={t(GENERATING_MESSAGES[messageIndex])} />
      ) : (
        <>
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[38px]">
                {t("Here are 3 layouts that work for your space.")}
              </h1>
              <p className="mt-3 text-[15.5px] leading-relaxed text-body">
                {t("Suggested based on the information you provided.")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCompareOpen((v) => !v)}
              aria-pressed={compareOpen}
              className={[
                "inline-flex h-10 items-center gap-1.5 rounded-pill border px-4 text-[13.5px] font-semibold transition-colors",
                compareOpen
                  ? "border-brand bg-wash text-brand"
                  : "border-hairline bg-surface-raised text-ink hover:border-brand/45",
              ].join(" ")}
            >
              <Icon name="swap" size={15} />
              {t("Compare layouts")}
            </button>
          </header>

          {compareOpen && <CompareTable options={options} t={t} />}

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {options.map((option, i) => (
              <LayoutCard
                key={option.id}
                index={i + 1}
                option={option}
                room={room!}
                selected={selectedId === option.id}
                onPreview={() => setPreviewId(option.id)}
                onChoose={() => choose(option, false)}
                t={t}
              />
            ))}
          </div>

          <p className="mt-6 max-w-2xl text-[12.5px] leading-relaxed text-body-soft">
            {t(
              "These are planning suggestions based on your measurements — not architectural drawings. A contractor should confirm anything structural before work starts.",
            )}
          </p>
        </>
      )}

      {preview && room && (
        <PreviewDialog
          option={preview}
          room={room}
          onClose={() => setPreviewId(null)}
          onChoose={() => {
            choose(preview, true);
            setPreviewId(null);
          }}
          t={t}
        />
      )}
    </StudioShell>
  );
}

function GeneratingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[46vh] flex-col items-center justify-center text-center">
      {/* A slow sweep, not a spinner — this should read as considered, not busy. */}
      <span className="relative block h-1 w-48 overflow-hidden rounded-full bg-hairline">
        <span className="absolute inset-y-0 left-0 w-1/3 animate-[sweep_1.6s_ease-in-out_infinite] rounded-full bg-brand motion-reduce:animate-none motion-reduce:w-full" />
      </span>
      <p role="status" aria-live="polite" className="mt-6 text-[16px] font-medium text-ink">
        {message}
      </p>
      <style>{`@keyframes sweep{0%{left:-33%}100%{left:100%}}`}</style>
    </div>
  );
}

function LayoutCard({
  index,
  option,
  room,
  selected,
  onPreview,
  onChoose,
  t,
}: {
  index: number;
  option: LayoutOption;
  room: Parameters<typeof RoomPlan>[0]["room"];
  selected: boolean;
  onPreview: () => void;
  onChoose: () => void;
  t: (s: string) => string;
}) {
  const hasError = option.plan.warnings.some((w) => w.severity === "error");

  return (
    <article
      className={[
        "flex flex-col overflow-hidden rounded-2xl border transition-[border-color,box-shadow]",
        selected
          ? "border-brand shadow-[0_10px_30px_rgb(7_140_200/0.15)]"
          : "border-hairline hover:border-brand/45",
        "bg-surface-raised",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-body-soft">
          {t("Layout")} {String(index).padStart(2, "0")}
        </span>
        {option.recommended && (
          <span className="inline-flex items-center gap-1 rounded-pill bg-wash px-2.5 py-1 text-[11px] font-semibold text-brand ring-1 ring-brand/30">
            <Icon name="star" size={12} />
            {t("Milagro recommends")}
          </span>
        )}
      </div>

      <div className="px-5 pt-3">
        <h2 className="text-[19px] font-semibold text-ink">{t(option.title)}</h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-body">{t(option.tagline)}</p>
      </div>

      <div className="mt-4 bg-wash/60 px-5 py-4">
        <RoomPlan
          room={room}
          unit="ft"
          plan={option.plan}
          compact
          ariaLabel={`${t(option.title)} — ${t("miniature floor plan")}`}
        />
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <ul className="space-y-1">
          {option.priorities.map((p) => (
            <li key={p} className="flex items-start gap-2 text-[13px] text-body">
              <Icon name="check" size={13} className="mt-1 shrink-0 text-brand/70" />
              {t(p)}
            </li>
          ))}
          <li className="flex items-start gap-2 text-[13px] text-body">
            <Icon name="ruler" size={13} className="mt-1 shrink-0 text-brand/70" />
            {option.clearFloorSqft} {t("sq ft clear floor")}
          </li>
        </ul>

        {hasError && (
          <p className="mt-3 flex items-start gap-1.5 text-[12.5px] text-body-soft">
            <Icon name="warning" size={13} className="mt-0.5 shrink-0" />
            {t("Tight for this room — some fixtures may not fit comfortably.")}
          </p>
        )}

        <div className="mt-4 flex gap-2 pt-1">
          <button
            type="button"
            onClick={onPreview}
            className="h-10 flex-1 rounded-pill border border-hairline bg-surface text-[13.5px]
                       font-semibold text-ink transition-colors hover:border-brand/45 hover:bg-wash"
          >
            {t("Preview")}
          </button>
          <button
            type="button"
            onClick={onChoose}
            aria-pressed={selected}
            className={[
              "h-10 flex-1 rounded-pill text-[13.5px] font-semibold transition-colors",
              selected
                ? "bg-brand text-on-brand"
                : "bg-clay text-on-clay hover:bg-clay-dark",
            ].join(" ")}
          >
            {selected ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="check" size={14} />
                {t("Chosen")}
              </span>
            ) : (
              t("Choose this layout")
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function CompareTable({ options, t }: { options: LayoutOption[]; t: (s: string) => string }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-hairline bg-surface-raised">
      <table className="w-full min-w-[520px] text-left text-[13.5px]">
        <caption className="sr-only">{t("Comparison of the three suggested layouts")}</caption>
        <thead>
          <tr className="border-b border-hairline">
            <th scope="col" className="px-5 py-3 font-semibold text-body-soft">
              {t("Layout")}
            </th>
            <th scope="col" className="px-5 py-3 font-semibold text-body-soft">
              {t("Prioritises")}
            </th>
            <th scope="col" className="px-5 py-3 font-semibold text-body-soft">
              {t("Clear floor")}
            </th>
            <th scope="col" className="px-5 py-3 font-semibold text-body-soft">
              {t("Notes")}
            </th>
          </tr>
        </thead>
        <tbody>
          {options.map((o) => (
            <tr key={o.id} className="border-b border-hairline last:border-0">
              <th scope="row" className="px-5 py-3.5 font-semibold text-ink">
                {t(o.title)}
                {o.recommended && (
                  <span className="ml-2 text-[11px] font-semibold text-brand">
                    {t("Recommended")}
                  </span>
                )}
              </th>
              <td className="px-5 py-3.5 text-body">{o.priorities.map((p) => t(p)).join(", ")}</td>
              <td className="px-5 py-3.5 text-body">
                {o.clearFloorSqft} {t("sq ft")}
              </td>
              <td className="px-5 py-3.5 text-body-soft">
                {o.plan.warnings.length
                  ? `${o.plan.warnings.length} ${t("to check")}`
                  : t("No clearance issues")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewDialog({
  option,
  room,
  onClose,
  onChoose,
  t,
}: {
  option: LayoutOption;
  room: Parameters<typeof RoomPlan>[0]["room"];
  onClose: () => void;
  onChoose: () => void;
  t: (s: string) => string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm sm:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${t(option.title)} ${t("preview")}`}
        className="max-h-full w-full max-w-3xl overflow-y-auto rounded-3xl border border-hairline bg-surface-raised p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-semibold text-ink">{t(option.title)}</h2>
            <p className="mt-1 text-[14px] text-body">{t(option.tagline)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close")}
            className="-m-2 rounded-full p-2 text-body-soft transition-colors hover:bg-wash hover:text-ink"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-wash/60 p-5">
          <RoomPlan room={room} unit="ft" plan={option.plan} />
        </div>

        {option.plan.warnings.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {option.plan.warnings.map((w, i) => (
              <li key={`${w.code}-${i}`} className="flex items-start gap-2 text-[13px] text-body">
                <Icon
                  name="warning"
                  size={14}
                  className={`mt-0.5 shrink-0 ${w.severity === "error" ? "text-danger" : "text-body-soft"}`}
                />
                <span>
                  <span className="font-semibold text-ink">
                    {w.severity === "error" ? t("Needs attention") : t("Worth checking")}
                  </span>{" "}
                  — {w.message}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-pill px-5 text-sm font-semibold text-body transition-colors hover:bg-wash hover:text-ink"
          >
            {t("Back to options")}
          </button>
          <button
            type="button"
            onClick={onChoose}
            className="h-11 rounded-pill bg-clay px-6 text-sm font-semibold text-on-clay transition-colors hover:bg-clay-dark"
          >
            {t("Choose this layout")}
          </button>
        </div>
      </div>
    </div>
  );
}
