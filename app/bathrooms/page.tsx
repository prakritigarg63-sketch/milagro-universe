"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/auth/AuthGate";
import { useAuth } from "@/components/auth/AuthProvider";
import Navbar from "@/components/site/Navbar";
import Icon from "@/components/ui/Icon";
import { STYLE_PHOTOS } from "@/components/planner/sections/StyleInspiration";
import { useT } from "@/lib/i18n/useT";
import { listProjectsAction } from "@/app/planner/actions";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { areaSqft, formatInr, inchesToFeetInchesShort } from "@/lib/planner/units";
import type { ArchitectureStyle, CostTier, Project } from "@/lib/planner/types";

/**
 * My Bathrooms — the signed-in home. Laptop-first dashboard: rich project cards
 * (style photo, size, style, estimate, how far the plan has got), a tile to
 * start another bathroom, and the three things worth doing next. Colours come
 * from tokens only; `app-theme` maps them to the signed-in palette.
 */

type T = ReturnType<typeof useT>;

function styleName(t: T, s: ArchitectureStyle): string {
  switch (s) {
    case "modern":
      return t("Modern");
    case "traditional":
      return t("Traditional");
    case "minimal":
      return t("Minimal");
    case "luxury":
      return t("Luxury");
  }
}

function tierName(t: T, tier: CostTier): string {
  switch (tier) {
    case "budget":
      return t("Budget friendly");
    case "costEffective":
      return t("Cost effective");
    case "goodQuality":
      return t("Good quality");
    case "topOfLine":
      return t("Top of the line");
  }
}

/** How far a plan has got, from what has been saved: 1..4 of 4. */
function progressOf(t: T, p: Project): { step: number; label: string } {
  if (p.status === "shared") return { step: 4, label: t("Shared with contractor") };
  if (p.status === "planned") return { step: 4, label: t("Brief saved") };
  if (p.estimate) return { step: 3, label: t("Estimate ready") };
  if (p.plan) return { step: 2, label: t("4D plan ready") };
  return { step: 1, label: t("Measurements added") };
}

export default function BathroomsPage() {
  // Access is enforced in proxy.ts before this ever renders; AuthGate only
  // holds the frame while the session loads.
  const { user, ready, onboarding } = useAuth();
  const t = useT();
  const router = useRouter();

  const loadProject = useProjectStore((s) => s.loadProject);
  const newProject = useProjectStore((s) => s.newProject);
  const removeProject = useProjectStore((s) => s.removeProject);

  const [projects, setProjects] = useState<Project[] | null>(null);

  const refresh = useCallback(async () => {
    try {
      setProjects(await listProjectsAction());
    } catch {
      setProjects([]);
    }
  }, []);

  // Load the user's projects once the session is ready. The setState lands after
  // the await (asynchronously), and the flag guards against a late resolve.
  useEffect(() => {
    if (!(ready && user)) return;
    let active = true;
    (async () => {
      try {
        const list = await listProjectsAction();
        if (active) setProjects(list);
      } catch {
        if (active) setProjects([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [ready, user]);

  async function open(id: string, href = "/planner/classic/space") {
    await loadProject(id);
    router.push(href);
  }

  async function create() {
    const p = await newProject(onboarding?.bathroomName);
    if (p) router.push("/planner/classic/space");
  }

  async function remove(id: string) {
    await removeProject(id);
    void refresh();
  }

  /** Next-step links work on the most recent bathroom, or start one. */
  async function goToStep(href: string) {
    if (projects && projects[0]) {
      await open(projects[0].id, href);
    } else {
      await create();
    }
  }

  const hasProjects = !!projects && projects.length > 0;

  return (
    <AuthGate>
      {/* The navbar sits inside the app theme too, so its links and avatar lose the blue. */}
      <div className="app-theme">
        <Navbar />
        <main className="min-h-screen bg-blueprint pt-[72px]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-6 lg:py-16 2xl:max-w-[1440px]">
            <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
              <div>
                <h1 className="text-[36px] leading-[1.05] text-ink sm:text-[44px] lg:text-[54px]">
                  {t("My Bathrooms")}
                </h1>
                <p className="mt-3 text-[17px] text-body lg:text-[18px]">
                  {hasProjects
                    ? t("Pick up any plan, or start a new one.")
                    : t("Start with a name and a few measurements — Milagro Universe takes it from there.")}
                </p>
              </div>
              {hasProjects && (
                <button
                  type="button"
                  onClick={create}
                  className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-action px-6 text-[15px] font-semibold text-on-action shadow-soft transition-[transform,background-color] duration-200 hover:-translate-y-px hover:bg-action-dark motion-reduce:hover:translate-y-0"
                >
                  <Icon name="plus" size={16} />
                  {t("New bathroom")}
                </button>
              )}
            </header>
  
            {projects === null ? (
              <ul className="mt-10 grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]" aria-hidden="true">
                {[0, 1].map((i) => (
                  <li key={i} className="h-[420px] animate-pulse rounded-card border border-hairline bg-surface-raised motion-reduce:animate-none" />
                ))}
              </ul>
            ) : hasProjects ? (
              <>
                <ul className="mt-10 grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
                  {projects.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      onOpen={() => open(p.id)}
                      onDelete={() => remove(p.id)}
                    />
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={create}
                      className="group flex h-full min-h-[240px] w-full flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-field bg-surface-raised/60 p-8 text-center transition-colors hover:border-brand hover:bg-surface-raised"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-wash text-brand transition-colors group-hover:bg-action group-hover:text-on-action">
                        <Icon name="plus" size={24} />
                      </span>
                      <span className="text-[19px] font-semibold text-ink">{t("Start a new bathroom")}</span>
                      <span className="max-w-[260px] text-[15px] text-body">
                        {t("Plan a guest bath, a kids' bath or a powder room alongside this one.")}
                      </span>
                    </button>
                  </li>
                </ul>
  
                <NextSteps onStep={goToStep} />
              </>
            ) : (
              <>
                <EmptyState onStart={create} />
                <NextSteps onStep={goToStep} />
              </>
            )}
          </div>
        </main>
      </div>
    </AuthGate>
  );
}

function ProjectCard({
  project: p,
  onOpen,
  onDelete,
}: {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const progress = progressOf(t, p);
  const cover = STYLE_PHOTOS[p.style.architecture][0];

  return (
    <li className="flex flex-col overflow-hidden rounded-card border border-hairline bg-surface-raised shadow-soft">
      <div className="relative aspect-[16/10] bg-wash">
        <Image src={cover} alt="" fill sizes="(min-width: 1536px) 420px, (min-width: 640px) 45vw, 100vw" className="object-cover" />
        <span className="absolute top-3 left-3 rounded-full bg-surface-raised/90 px-3 py-1 text-[13px] font-semibold text-ink shadow-soft">
          {styleName(t, p.style.architecture)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="text-[24px] leading-tight text-ink">{p.room.name}</h2>
        <p className="mt-2 text-[15px] text-body">
          {inchesToFeetInchesShort(p.room.lengthInches)} × {inchesToFeetInchesShort(p.room.widthInches)}
          {" · "}
          {areaSqft(p.room.lengthInches, p.room.widthInches)} sq.ft
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-hairline pt-5">
          <div>
            <dt className="text-[13px] text-body-soft">{t("Finish level")}</dt>
            <dd className="mt-1 text-[15px] font-semibold text-ink">{tierName(t, p.style.costTier)}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-body-soft">{t("Estimate")}</dt>
            <dd className="mt-1 text-[15px] font-semibold text-ink tabular-nums">
              {p.estimate ? formatInr(p.estimate.totalCostInr) : t("Not yet")}
            </dd>
          </div>
        </dl>

        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[14px] font-semibold text-ink">{progress.label}</span>
            <span className="text-[13px] text-body-soft tabular-nums">{progress.step} / 4</span>
          </div>
          <div
            className="mt-2 grid grid-cols-4 gap-1.5"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={4}
            aria-valuenow={progress.step}
            aria-label={progress.label}
          >
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={["h-1.5 rounded-full", i <= progress.step ? "bg-action" : "bg-field"].join(" ")} />
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[12px] bg-action px-5 text-[15px] font-semibold text-on-action transition-colors hover:bg-action-dark"
          >
            {t("Continue planning")}
            <Icon name="arrowRight" size={15} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-11 items-center rounded-[12px] px-4 text-[15px] font-semibold text-body-soft transition-colors hover:bg-wash hover:text-ink"
          >
            {t("Delete")}
          </button>
        </div>
      </div>
    </li>
  );
}

/** A real sequence, so the numbers carry meaning. */
function NextSteps({ onStep }: { onStep: (href: string) => void }) {
  const t = useT();
  const steps = [
    {
      href: "/planner/classic/space",
      title: t("Measure & choose a style"),
      body: t("Enter the room size, place the door and window, and pick the look you want."),
      cta: t("Open measurements"),
    },
    {
      href: "/planner/classic/plan",
      title: t("See it in 4D"),
      body: t("Walk around your bathroom in 3D and play the build, day by day."),
      cta: t("Open the 4D plan"),
    },
    {
      href: "/planner/classic/brief",
      title: t("Get the estimate & share"),
      body: t("Check materials and cost, then send the brief to your contractor."),
      cta: t("Open the brief"),
    },
  ];

  return (
    <section className="mt-16 border-t border-hairline pt-12 lg:mt-20" aria-labelledby="next-steps">
      <h2 id="next-steps" className="text-[30px] leading-tight text-ink lg:text-[38px]">
        {t("Make the most of your plan")}
      </h2>
      <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
        {steps.map((s, i) => (
          <li key={s.href} className="flex flex-col">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-field bg-surface-raised text-[15px] font-semibold text-ink tabular-nums">
              {i + 1}
            </span>
            <h3 className="mt-4 text-[20px] font-semibold text-ink">{s.title}</h3>
            <p className="mt-2 max-w-[38ch] text-[16px] leading-relaxed text-body">{s.body}</p>
            <button
              type="button"
              onClick={() => onStep(s.href)}
              className="mt-4 inline-flex w-fit items-center gap-1.5 text-[15px] font-semibold text-brand hover:underline"
            >
              {s.cta}
              <Icon name="arrowRight" size={14} />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Shown when the user has no saved plans yet. */
function EmptyState({ onStart }: { onStart: () => void }) {
  const t = useT();
  return (
    <div className="mt-10 flex flex-col items-center rounded-card border border-hairline bg-surface-raised px-6 py-16 text-center shadow-soft">
      <svg viewBox="0 0 120 96" width="132" aria-hidden="true" focusable="false" className="mb-7">
        <g fill="none" stroke="var(--color-brand)" strokeLinejoin="round" strokeLinecap="round">
          <rect x="14" y="14" width="92" height="68" rx="3" strokeWidth="2" opacity="0.9" />
          <g strokeWidth="1.2" opacity="0.55">
            <rect x="24" y="24" width="26" height="34" rx="12" />
            <rect x="76" y="24" width="20" height="12" rx="2" />
            <ellipse cx="86" cy="64" rx="10" ry="6" />
            <path d="M24 70h30" />
          </g>
          <g strokeWidth="1" opacity="0.35">
            <path d="M14 8h92M14 4v8M106 4v8" />
          </g>
        </g>
      </svg>

      <h2 className="text-[30px] leading-tight text-ink">{t("You haven't created a bathroom yet.")}</h2>
      <p className="mt-3 max-w-md text-[17px] text-body">
        {t("Start with a name and a few measurements — Milagro Universe takes it from there.")}
      </p>

      <button
        type="button"
        onClick={onStart}
        className="mt-7 inline-flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-action px-8 text-[16px] font-semibold text-on-action shadow-[0_6px_18px_rgb(138_90_43/0.28)] transition-[transform,background-color] duration-200 hover:-translate-y-px hover:bg-action-dark motion-reduce:hover:translate-y-0"
      >
        <Icon name="plus" size={17} />
        {t("Create Your First Bathroom")}
      </button>
    </div>
  );
}
