"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { useStudioStore } from "@/lib/planner/studio/studio-store";
import { StudioShell } from "@/components/planner/studio/StudioShell";
import { StepFooter } from "@/components/planner/studio/StepFooter";
import { Room3DWebGL } from "@/components/planner/studio/Room3DWebGL";
import { RoomPlan } from "@/components/planner/studio/RoomPlan";
import { formatLakh, projectRange } from "@/lib/planner/studio/materials";
import { openPrintablePlan } from "@/lib/planner/studio/printable";
import { SharePanel } from "@/components/planner/studio/SharePanel";
import { CommentsThread } from "@/components/planner/collab/CommentsThread";

/**
 * Screen 12 — the finished plan.
 *
 * The reward screen. Everything decided, in one place, with the number the
 * homeowner came for. The three actions that need an account are gated here and
 * only here — by this point there is something genuinely worth keeping.
 */
export default function PlanPage() {
  const t = useT();
  const router = useRouter();
  const { user } = useAuth();
  const { project } = useEnsureProject();
  const generateEstimate = useProjectStore((s) => s.generateEstimate);
  const finalize = useProjectStore((s) => s.finalize);
  const openSaveGate = useStudioStore((s) => s.openSaveGate);

  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const signature = project
    ? `${project.room.lengthInches}x${project.room.widthInches}:${project.style.costTier}:${project.fixtures.length}`
    : null;

  useEffect(() => {
    if (signature) generateEstimate();
  }, [signature, generateEstimate]);

  const room = project?.room;
  const fixtures = project?.placedFixtures ?? project?.plan?.fixtures ?? [];
  const estimate = project?.estimate ?? null;
  const range = estimate ? projectRange(estimate.totalCostInr) : null;
  const finishes = useMemo(() => project?.finishes ?? {}, [project?.finishes]);

  /** What is actually decided, so the checklist cannot claim more than is true. */
  const checklist = [
    { label: "Bathroom measurements", done: Boolean(room) },
    { label: "Final layout", done: Boolean(project?.selectedLayoutId) },
    { label: "2D plan", done: fixtures.length > 0 },
    { label: "3D visualization", done: fixtures.length > 0 },
    { label: "Selected fixtures", done: fixtures.length > 0 },
    { label: "Tiles & finishes", done: Object.keys(finishes).length > 0 },
    { label: "Material quantities", done: Boolean(estimate?.bom.length) },
    { label: "Indicative budget", done: Boolean(estimate) },
  ];

  function handleSave() {
    if (!user) {
      openSaveGate("save");
      return;
    }
    finalize();
    setSavedNote(t("Saved to your account."));
    window.setTimeout(() => setSavedNote(null), 2600);
  }

  function handleDownload() {
    if (!user) {
      openSaveGate("download");
      return;
    }
    if (project) openPrintablePlan(project);
  }

  function handleShare() {
    if (!user) {
      openSaveGate("share");
      return;
    }
    // A guest project lives in this browser and has no server id to invite
    // anyone to. Signing in migrates it first (see claimGuestProjects), so by
    // the time we get here there should be a real project — but check, rather
    // than minting an invite against an id the server has never seen.
    if (!project || project.ownerId === "guest") {
      setShareNote(t("Save the plan first, then you can share it."));
      window.setTimeout(() => setShareNote(null), 3200);
      return;
    }
    setShareOpen(true);
  }

  return (
    <StudioShell
      stepId="plan"
      footer={
        <StepFooter
          stepId="plan"
          continueLabel={t("Save my bathroom")}
          continueOverride={handleSave}
        />
      }
    >
      <header className="max-w-2xl">
        <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-ink sm:text-[44px]">
          {t("Your bathroom is ready to take shape.")}
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-body">
          {t("Everything you’ve planned, in one place.")}
        </p>
      </header>

      {room && (
        <>
          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-raised p-5 sm:p-7">
              <Room3DWebGL project={project} />
            </div>
            {/* The plan is wider than it is tall, so it would sit at the top of a
                stretched grid cell with a void beneath it. Centre it instead. */}
            <div className="flex items-center overflow-hidden rounded-2xl border border-hairline bg-surface-raised p-5 sm:p-7">
              <RoomPlan
                room={room}
                unit="ft"
                placed={fixtures}
                doorDetail={project.doorDetail}
                extraOpenings={project.extraOpenings}
                plumbing={project.plumbing}
                ariaLabel={t("Final 2D plan")}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
            {/* ── Checklist ──────────────────────────────────────────── */}
            <section className="rounded-2xl border border-hairline bg-surface-raised p-5 sm:p-6">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-body-soft">
                {t("Your Milagro plan")}
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-start gap-2 text-[14px]">
                    <Icon
                      name={item.done ? "check" : "close"}
                      size={14}
                      className={`mt-1 shrink-0 ${item.done ? "text-brand" : "text-body-soft"}`}
                    />
                    <span className={item.done ? "text-ink" : "text-body-soft"}>
                      {t(item.label)}
                      {!item.done && (
                        <span className="ml-1 text-[12px]">({t("not set")})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── Range + actions ────────────────────────────────────── */}
            <aside className="rounded-2xl border border-brand/30 bg-wash p-5 sm:p-6">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">
                {t("Estimated project range")}
              </h2>
              {range ? (
                <p className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-ink tabular-nums">
                  {formatLakh(range.lowInr)} – {formatLakh(range.highInr)}
                </p>
              ) : (
                <p className="mt-2 text-[14px] text-body-soft">{t("Working it out…")}</p>
              )}
              <p className="mt-1 text-[13px] text-body">{t("Planning estimate")}</p>

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-clay
                             text-[14px] font-semibold text-on-clay transition-colors hover:bg-clay-dark"
                >
                  <Icon name="bookmark" size={16} />
                  {t("Save my bathroom")}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <ActionButton icon="arrowDown" label={t("Download")} onClick={handleDownload} />
                  <ActionButton icon="swap" label={t("Share")} onClick={handleShare} />
                </div>
                <ActionButton
                  icon="home"
                  label={t("Edit design")}
                  onClick={() => router.push("/planner/design")}
                  full
                />
              </div>

              {(savedNote || shareNote) && (
                <p className="mt-3 text-center text-[12.5px] text-body" role="status">
                  {savedNote ?? shareNote}
                </p>
              )}
            </aside>
          </div>

          <p className="mt-6 max-w-2xl text-[12.5px] leading-relaxed text-body-soft">
            {t(
              "This plan is a starting point for conversations with contractors and suppliers — not a construction drawing or a quote. Measurements, quantities and prices should all be confirmed on site.",
            )}
          </p>

          {/* Collaboration: threaded comments for a saved project. A guest
              (browser-only) project has no server id to attach a thread to. */}
          {project && user && project.ownerId !== "guest" && (
            <div className="mt-6 max-w-3xl">
              <CommentsThread projectId={project.id} />
            </div>
          )}

          {shareOpen && project && (
            <SharePanel projectId={project.id} onClose={() => setShareOpen(false)} />
          )}
        </>
      )}
    </StudioShell>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  full = false,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  onClick: () => void;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-11 items-center justify-center gap-1.5 rounded-pill border border-hairline",
        "bg-surface-raised text-[13.5px] font-semibold text-ink transition-colors",
        "hover:border-brand/45 hover:bg-surface",
        full ? "w-full" : "",
      ].join(" ")}
    >
      <Icon name={icon} size={15} />
      {label}
    </button>
  );
}
