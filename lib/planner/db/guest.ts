"use client";

import type { Project } from "@/lib/planner/types";
import {
  defaultRoom,
  defaultStyle,
  defaultFixtures,
  defaultAddOns,
} from "@/lib/planner/defaults";

/**
 * Guest (signed-out) project storage.
 *
 * The studio lets people plan a whole bathroom before we ask for an account —
 * so there has to be somewhere to keep the work that is not the database. This
 * is that place: the same `Project` shape, in this browser only.
 *
 * It is deliberately NOT a second source of truth. The moment a user signs in,
 * `claimGuestProjects()` hands everything to the server and empties the drawer,
 * and every read after that goes to the database. Nothing is kept in both.
 *
 * localStorage can throw (private mode, blocked site data) and can come back
 * empty. Every access is wrapped; a failure degrades to an in-memory project
 * for the session rather than breaking the planner.
 */

const KEY = "milagro.guest.projects";
const GUEST_OWNER = "guest";

/** Survives a throwing localStorage so the planner still works in private mode. */
let memoryFallback: Project[] | null = null;

function read(): Project[] {
  if (memoryFallback) return memoryFallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Project[]) : [];
  } catch {
    return memoryFallback ?? [];
  }
}

function write(projects: Project[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(projects));
    memoryFallback = null;
  } catch {
    // Quota, private mode, or blocked site data. Keep the work for this tab.
    memoryFallback = projects;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function newGuestProject(name: string): Project {
  return {
    id: newId(),
    ownerId: GUEST_OWNER,
    members: [{ userId: GUEST_OWNER, role: "owner" }],
    status: "draft",
    room: { ...defaultRoom(), name: name || defaultRoom().name },
    style: defaultStyle(),
    fixtures: defaultFixtures(),
    addOns: defaultAddOns(),
    plan: null,
    estimate: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

/** Newest first, matching the server store's ordering. */
export function listGuestProjects(): Project[] {
  return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getGuestProject(id: string): Project | null {
  return read().find((p) => p.id === id) ?? null;
}

export function createGuestProject(name: string): Project {
  const project = newGuestProject(name);
  write([project, ...read()]);
  return project;
}

export function saveGuestProject(project: Project): Project {
  const next = { ...project, updatedAt: nowIso() };
  const rest = read().filter((p) => p.id !== project.id);
  write([next, ...rest]);
  return next;
}

export function deleteGuestProject(id: string): void {
  write(read().filter((p) => p.id !== id));
}

/** The studio's entry point: resume the most recent guest project or start one. */
export function loadOrCreateGuestProject(): Project {
  return listGuestProjects()[0] ?? createGuestProject("My Bathroom");
}

export function hasGuestProjects(): boolean {
  return read().length > 0;
}

/** Read everything and empty the drawer, in one step. Used at sign-in so a
 *  half-finished migration cannot leave duplicates behind on a retry. */
export function takeGuestProjects(): Project[] {
  const all = listGuestProjects();
  if (all.length) write([]);
  return all;
}
