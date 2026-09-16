/**
 * Every event name Milagro Universe sends to Mixpanel, in one place.
 *
 * Event names are a schema. Once a name is in Mixpanel it is effectively
 * permanent — reports, funnels and saved boards all key off the string — so
 * they live here as constants rather than as literals at the call site, where
 * "Project Created" and "Project created" would quietly become two events and
 * split every funnel built on them.
 *
 * Title Case is Mixpanel's own convention and what its UI assumes.
 */
export const EVENTS = {
  PAGE_VIEWED: "Page Viewed",
  SIGNED_IN: "Signed In",
  SIGNED_OUT: "Signed Out",
  SIGNED_UP: "Signed Up",
  ONBOARDING_COMPLETED: "Onboarding Completed",
  PROJECT_CREATED: "Project Created",
  PROJECT_DELETED: "Project Deleted",
  PLANNER_STEP_VIEWED: "Planner Step Viewed",
  INVITE_CREATED: "Invite Created",
  INVITE_ACCEPTED: "Invite Accepted",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * The planner is a sequence, and the funnel only reads well if the steps are
 * ordered. Mixpanel sorts string properties alphabetically, so the step index
 * rides along with the name.
 */
export const PLANNER_STEPS = [
  "space",
  "style",
  "fixtures",
  "plan",
  "estimate",
  "docs",
  "brief",
  "guides",
] as const;

export type PlannerStep = (typeof PLANNER_STEPS)[number];

/** `/planner/style` -> `style`. Returns null for anything that is not a step. */
export function plannerStepFromPath(pathname: string): PlannerStep | null {
  const match = /^\/planner\/([^/]+)/.exec(pathname);
  const step = match?.[1];
  return PLANNER_STEPS.includes(step as PlannerStep) ? (step as PlannerStep) : null;
}
