import type { IconName } from "@/components/ui/Icon";

/**
 * The studio journey.
 *
 * Twelve screens, six phases. The split is deliberate: the work genuinely takes
 * twelve steps, but a twelve-segment progress bar reads as a chore before the
 * first question is answered. The homeowner sees the six phases; the steps are
 * what the Back/Continue buttons actually walk.
 *
 * This is the single source of order. Routes, the phase rail, and both footer
 * buttons all derive from it, so inserting a screen is one entry here rather
 * than a hunt through twelve files for hard-coded neighbours.
 */

export type PhaseId = "project" | "space" | "layout" | "visualize" | "style" | "estimate";

export interface Phase {
  id: PhaseId;
  label: string;
  icon: IconName;
}

export const PHASES: Phase[] = [
  { id: "project", label: "Project", icon: "home" },
  { id: "space", label: "Space", icon: "ruler" },
  { id: "layout", label: "Layout", icon: "layers" },
  { id: "visualize", label: "Visualize", icon: "eye" },
  { id: "style", label: "Style", icon: "sparkle" },
  { id: "estimate", label: "Estimate", icon: "calculator" },
];

export interface Step {
  id: string;
  /** Absolute route. The first step owns /planner itself. */
  href: string;
  phase: PhaseId;
  /** Shown in the header as the current activity. */
  title: string;
  /**
   * Whether the route exists yet. The journey is declared in full so the
   * phase rail reads correctly from the start, but Continue must never walk
   * someone into a 404 — the navigation helpers below only ever return a
   * step that has been built.
   */
  built?: boolean;
}

export const STEPS: Step[] = [
  { id: "type", href: "/planner", phase: "project", title: "Project type", built: true },
  { id: "measure", href: "/planner/measure", phase: "space", title: "Measurements", built: true },
  { id: "openings", href: "/planner/openings", phase: "space", title: "Doors & windows", built: true },
  { id: "layouts", href: "/planner/layouts", phase: "layout", title: "Layout suggestions", built: true },
  { id: "design", href: "/planner/design", phase: "layout", title: "Planner", built: true },
  { id: "visualize", href: "/planner/visualize", phase: "visualize", title: "Visualize", built: true },
  { id: "style", href: "/planner/style", phase: "style", title: "Style", built: true },
  { id: "budget", href: "/planner/budget", phase: "style", title: "Budget", built: true },
  { id: "products", href: "/planner/products", phase: "estimate", title: "Products", built: true },
  { id: "materials", href: "/planner/materials", phase: "estimate", title: "Materials", built: true },
  { id: "estimate", href: "/planner/estimate", phase: "estimate", title: "Estimate", built: true },
  { id: "plan", href: "/planner/plan", phase: "estimate", title: "Your plan", built: true },
];

export function stepIndexOf(id: string): number {
  return STEPS.findIndex((s) => s.id === id);
}

export function stepById(id: string): Step | undefined {
  return STEPS.find((s) => s.id === id);
}

export function prevStep(id: string): Step | undefined {
  const i = stepIndexOf(id);
  if (i <= 0) return undefined;
  return [...STEPS.slice(0, i)].reverse().find((s) => s.built);
}

export function nextStep(id: string): Step | undefined {
  const i = stepIndexOf(id);
  if (i < 0) return undefined;
  return STEPS.slice(i + 1).find((s) => s.built);
}

/** True when nothing further has been built yet. */
export function isLastBuiltStep(id: string): boolean {
  return nextStep(id) === undefined;
}

/** Phase of a step, and how far through the journey that phase sits. */
export function phaseIndexOf(stepId: string): number {
  const step = stepById(stepId);
  if (!step) return 0;
  return PHASES.findIndex((p) => p.id === step.phase);
}

/**
 * The first step of each phase — where the rail sends you when you click back
 * to a phase you have already been through.
 */
export function entryStepForPhase(phase: PhaseId): Step {
  return STEPS.find((s) => s.phase === phase && s.built) ?? STEPS[0];
}

/**
 * Progress through the whole journey, 0–1. Used for the thin rail fill, not
 * shown as a number — "step 7 of 12" is exactly the framing we are avoiding.
 */
export function progressAt(stepId: string): number {
  const i = stepIndexOf(stepId);
  return i < 0 ? 0 : (i + 1) / STEPS.length;
}
