"use client";

import "./planner.css";
import { AppProviders } from "@/components/planner/providers";
import { useTheme } from "@/lib/planner/theme/provider";

/** Scopes the planner's component tokens to everything under /planner. The
 *  tokens themselves are aliases of the site's (globals.css), so the planner and
 *  the landing share one palette, one type family and one theme. */
function PlannerFrame({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <div className="bc-planner app-theme" data-theme={theme}>
      {children}
    </div>
  );
}

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* The icon font only — text is set in the site's Hanken Grotesk. React 19 hoists
          this <link> into <head>; a remote CSS @import is dropped by Turbopack.
          display=block is correct for an icon font (no ligature-text flash). */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
      />
      <AppProviders>
        <PlannerFrame>{children}</PlannerFrame>
      </AppProviders>
    </>
  );
}
