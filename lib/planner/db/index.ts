"use client";

/**
 * Planner data access (client side).
 *
 * Two backing stores, one surface. Signed-in users read and write Supabase via
 * the Auth.js-scoped server actions in app/planner/actions.ts. Signed-out users
 * get `guest.ts` — the same `Project` shape in localStorage — so the studio can
 * be explored end to end before anyone is asked for an account.
 *
 * Which store is used is decided by `setAuthState()`, called once the session
 * resolves. Before that it is unknown, so the first call tries the server and
 * falls back to guest storage if the action reports no session. That fallback
 * is the safety net, not the mechanism: it keeps a race between the first save
 * and the session query from throwing away a keystroke.
 */

import type { Project } from "@/lib/planner/types";
import {
  listProjectsAction,
  loadOrCreateProjectAction,
  getProjectAction,
  createProjectAction,
  saveProjectAction,
  deleteProjectAction,
} from "@/app/planner/actions";
import {
  listGuestProjects,
  getGuestProject,
  createGuestProject,
  saveGuestProject,
  deleteGuestProject,
  loadOrCreateGuestProject,
  takeGuestProjects,
  hasGuestProjects,
} from "./guest";

/** null = session not resolved yet. */
let signedIn: boolean | null = null;

/** Called when the Auth.js session resolves (and on every change after). */
export function setAuthState(next: boolean): void {
  signedIn = next;
}

export function isGuest(): boolean {
  return signedIn === false;
}

/** The server actions throw this when there is no session. */
function isAuthError(error: unknown): boolean {
  return error instanceof Error && /not authenticated/i.test(error.message);
}

/**
 * Run the server path, falling back to guest storage when there is no session.
 * Only an auth failure falls back — a network or database error must surface,
 * not silently fork a signed-in user's work into this browser.
 */
async function route<T>(server: () => Promise<T>, guest: () => T): Promise<T> {
  if (signedIn === false) return guest();
  try {
    return await server();
  } catch (error) {
    if (signedIn === null && isAuthError(error)) {
      signedIn = false;
      return guest();
    }
    throw error;
  }
}

export function listProjects(): Promise<Project[]> {
  return route(listProjectsAction, listGuestProjects);
}

export function loadOrCreateProject(): Promise<Project> {
  return route(loadOrCreateProjectAction, loadOrCreateGuestProject);
}

export function getProject(id: string): Promise<Project | null> {
  return route(
    () => getProjectAction(id),
    () => getGuestProject(id),
  );
}

export function createProject(name: string): Promise<Project> {
  return route(
    () => createProjectAction(name),
    () => createGuestProject(name),
  );
}

export function saveProject(project: Project): Promise<Project> {
  return route(
    () => saveProjectAction(project),
    () => saveGuestProject(project),
  );
}

export function deleteProject(id: string): Promise<void> {
  return route(
    () => deleteProjectAction(id),
    () => {
      deleteGuestProject(id);
    },
  );
}

export { hasGuestProjects };

/**
 * Move anything planned while signed out into the new account.
 *
 * Called once, immediately after sign-in. `takeGuestProjects()` empties the
 * local drawer as it reads, so a failure part-way cannot duplicate a project on
 * the next attempt — the cost of a mid-flight failure is the un-migrated tail,
 * not two copies of the same bathroom.
 *
 * Returns the id of the first migrated project so the caller can reopen exactly
 * what the user was working on.
 */
export async function claimGuestProjects(): Promise<string | null> {
  const pending = takeGuestProjects();
  if (!pending.length) return null;

  let firstId: string | null = null;
  for (const guestProject of pending) {
    try {
      const created = await createProjectAction(guestProject.room.name);
      const migrated = await saveProjectAction({
        ...guestProject,
        id: created.id,
        ownerId: created.ownerId,
        members: created.members,
        createdAt: created.createdAt,
      });
      firstId ??= migrated.id;
    } catch {
      // Leave the rest; the user keeps a usable account either way.
      break;
    }
  }
  return firstId;
}
