"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { StudioShell } from "@/components/planner/studio/StudioShell";
import { StepFooter } from "@/components/planner/studio/StepFooter";
import { nextStep } from "@/lib/planner/studio/steps";
import type { ProjectType } from "@/lib/planner/types";

/**
 * Screen 1 — what are we building?
 *
 * The first question is not a measurement, because "how wide is your bathroom"
 * is a question you can get wrong. This one you cannot: everybody knows whether
 * they are starting from an empty room or changing the one they have. It also
 * earns its place — the answer decides whether we later ask about existing
 * plumbing at all.
 */

interface TypeCard {
  id: ProjectType;
  title: string;
  blurb: string;
  bestFor: string[];
  cta: string;
  photo: string;
  /** Photographs are decorative here; the card's text carries the meaning. */
  focus: string;
}

const CARDS: TypeCard[] = [
  {
    id: "newBuild",
    title: "Build a new bathroom",
    blurb: "Starting with an empty space.",
    bestFor: ["New homes", "New floors", "New bathroom construction"],
    cta: "Start from scratch",
    photo: "/photos/style-modern.jpg",
    focus: "center",
  },
  {
    id: "renovation",
    title: "Renovate my bathroom",
    blurb: "Improve an existing bathroom.",
    bestFor: ["Changing fixtures", "Moving plumbing", "Replacing tiles", "Changing the layout"],
    cta: "Plan my renovation",
    photo: "/photos/after.jpg",
    focus: "center",
  },
  {
    id: "redesign",
    title: "Redesign my bathroom",
    blurb: "Refresh the space without major construction.",
    bestFor: ["New colours", "Tiles", "Fixtures", "Vanity", "Styling"],
    cta: "Redesign my space",
    photo: "/photos/style-minimal.jpg",
    focus: "center",
  },
];

export default function ProjectTypePage() {
  const t = useT();
  const router = useRouter();
  const { project } = useEnsureProject();
  const setProjectType = useProjectStore((s) => s.setProjectType);

  const selected = project?.projectType ?? null;

  function choose(id: ProjectType) {
    setProjectType(id);
  }

  /** Double-click-free shortcut: picking a card and pressing on is one gesture. */
  function chooseAndGo(id: ProjectType) {
    setProjectType(id);
    const forward = nextStep("type");
    if (forward) router.push(forward.href);
  }

  return (
    <StudioShell
      stepId="type"
      footer={
        <StepFooter
          stepId="type"
          blockedReason={selected ? null : t("Choose one to continue")}
        />
      }
    >
      <header className="max-w-2xl">
        <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-ink sm:text-[44px]">
          {t("Let’s create your bathroom.")}
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-body">
          {t("Tell us what you’re working with. We’ll guide you from there.")}
        </p>
      </header>

      <div className="mt-10 grid gap-5 sm:mt-12 lg:grid-cols-3">
        {CARDS.map((card) => (
          <ProjectTypeCard
            key={card.id}
            card={card}
            eager={card.id === CARDS[0].id}
            selected={selected === card.id}
            onSelect={() => choose(card.id)}
            onSelectAndGo={() => chooseAndGo(card.id)}
            t={t}
          />
        ))}
      </div>

      <p className="mt-8 text-[13px] text-body-soft">
        {t("You can change this later — nothing here is locked in.")}
      </p>
    </StudioShell>
  );
}

function ProjectTypeCard({
  card,
  eager,
  selected,
  onSelect,
  onSelectAndGo,
  t,
}: {
  card: TypeCard;
  /** The first card is above the fold and is the LCP; it should not lazy-load. */
  eager: boolean;
  selected: boolean;
  onSelect: () => void;
  onSelectAndGo: () => void;
  t: (s: string) => string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onSelectAndGo}
      aria-pressed={selected}
      className={[
        "group relative flex flex-col overflow-hidden rounded-2xl border text-left",
        "transition-[transform,border-color,box-shadow] duration-200",
        "hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        selected
          ? "border-brand bg-surface-raised shadow-[0_10px_30px_rgb(7_140_200/0.15)]"
          : "border-hairline bg-surface-raised hover:border-brand/45",
      ].join(" ")}
    >
      <span className="relative block aspect-[16/10] w-full overflow-hidden bg-wash">
        <Image
          src={card.photo}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          priority={eager}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
        />
        {selected && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill bg-brand px-2.5 py-1 text-[11.5px] font-semibold text-on-brand">
            <Icon name="check" size={13} />
            {t("Selected")}
          </span>
        )}
      </span>

      <span className="flex flex-1 flex-col p-5">
        <span className="text-[18px] font-semibold leading-snug text-ink">{t(card.title)}</span>
        <span className="mt-1.5 text-[14px] text-body">{t(card.blurb)}</span>

        <span className="mt-4 block text-[11.5px] font-semibold uppercase tracking-[0.08em] text-body-soft">
          {t("Best for")}
        </span>
        <ul className="mt-2 space-y-1">
          {card.bestFor.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[13.5px] text-body">
              <Icon
                name="check"
                size={13}
                className="mt-1 shrink-0 text-brand/70"
                aria-hidden="true"
              />
              {t(item)}
            </li>
          ))}
        </ul>

        <span
          className={[
            "mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold transition-colors",
            selected ? "text-brand" : "text-ink-soft group-hover:text-brand",
          ].join(" ")}
        >
          {t(card.cta)}
          <Icon
            name="arrowRight"
            size={15}
            className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
          />
        </span>
      </span>
    </button>
  );
}
