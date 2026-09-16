"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/lib/planner/session";
import { setAuthState, claimGuestProjects } from "@/lib/planner/db";
import { useProjectStore } from "./project-store";

/**
 * Ensures a loaded project, signed in or not.
 *
 * Three things happen here, in order, and the order matters:
 *
 *  1. The data layer is told whether there is a session, so reads and writes go
 *     to the right store (Supabase vs. this browser).
 *  2. On the signed-out → signed-in transition, anything planned as a guest is
 *     claimed into the new account and reopened. This runs before the ordinary
 *     load so a returning user does not briefly see an empty project.
 *  3. Otherwise, load the last project or start a fresh one.
 *
 * Returns the current project (null while loading).
 */
export function useEnsureProject() {
  const { user, ready } = useSession();
  const project = useProjectStore((s) => s.project);
  const loadOrCreate = useProjectStore((s) => s.loadOrCreate);
  const loadProject = useProjectStore((s) => s.loadProject);

  /** Previous signed-in state, to spot the transition rather than the value. */
  const wasSignedIn = useRef<boolean | null>(null);
  /** Guards against a second claim if the effect re-runs mid-flight. */
  const claiming = useRef(false);

  useEffect(() => {
    if (!ready) return;
    const signedIn = !!user;
    setAuthState(signedIn);

    const justSignedIn = wasSignedIn.current === false && signedIn;
    wasSignedIn.current = signedIn;

    if (justSignedIn && !claiming.current) {
      claiming.current = true;
      void claimGuestProjects()
        .then((claimedId) => (claimedId ? loadProject(claimedId) : loadOrCreate()))
        .catch(() => loadOrCreate())
        .finally(() => {
          claiming.current = false;
        });
      return;
    }

    if (!project) void loadOrCreate();
  }, [ready, user, project, loadOrCreate, loadProject]);

  return { project, ready: ready && !!project };
}
