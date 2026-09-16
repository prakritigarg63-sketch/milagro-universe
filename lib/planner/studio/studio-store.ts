"use client";

import { create } from "zustand";
import { STEPS, stepIndexOf } from "./steps";

/**
 * Studio UI state — how far the homeowner has got, and whether the save gate
 * is showing. Deliberately separate from `project-store`: this is about the
 * session in front of us, not the bathroom being designed. None of it belongs
 * in the saved project.
 *
 * "Furthest reached" is what makes the phase rail navigable backwards. It is
 * remembered per project, so reopening a plan does not present a finished
 * bathroom behind a locked rail.
 */

const KEY = "milagro.studio.furthest";

type FurthestMap = Record<string, number>;

function readMap(): FurthestMap {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FurthestMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: FurthestMap): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* private mode — the rail just starts closed next visit */
  }
}

/** What the user was trying to do when we asked them to sign in. */
export type SaveIntent = "save" | "download" | "share" | null;

interface StudioState {
  furthestStepIndex: number;
  saveIntent: SaveIntent;

  /** Record arrival at a step; never moves the marker backwards. */
  reachStep: (projectId: string | null, stepId: string) => void;
  /** Restore the marker when a project loads. */
  hydrateFurthest: (projectId: string | null) => void;
  openSaveGate: (intent: Exclude<SaveIntent, null>) => void;
  closeSaveGate: () => void;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  furthestStepIndex: 0,
  saveIntent: null,

  reachStep(projectId, stepId) {
    const index = stepIndexOf(stepId);
    if (index < 0) return;
    if (index <= get().furthestStepIndex) return;
    set({ furthestStepIndex: index });
    if (projectId) {
      const map = readMap();
      map[projectId] = Math.max(map[projectId] ?? 0, index);
      writeMap(map);
    }
  },

  hydrateFurthest(projectId) {
    if (!projectId) return;
    const stored = readMap()[projectId] ?? 0;
    if (stored > get().furthestStepIndex) {
      set({ furthestStepIndex: Math.min(stored, STEPS.length - 1) });
    }
  },

  openSaveGate(intent) {
    set({ saveIntent: intent });
  },

  closeSaveGate() {
    set({ saveIntent: null });
  },
}));
