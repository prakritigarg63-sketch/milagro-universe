import type { Metadata } from "next";

/**
 * The studio's layout.
 *
 * Intentionally thin. The studio uses the marketing site's design tokens, fonts
 * and theme — the ones already set on <html> by the root layout — so that
 * walking from the homepage into the planner does not feel like arriving at a
 * different product. There is no scoped theme wrapper here on purpose; the
 * earlier mobile wizard's `bc-planner` frame now lives in
 * app/planner/classic/layout.tsx and applies only to those routes.
 */

export const metadata: Metadata = {
  title: "Planner — Milagro Universe",
  description:
    "Measure your bathroom, try layouts, choose a style and see an indicative cost — before you build.",
};

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
