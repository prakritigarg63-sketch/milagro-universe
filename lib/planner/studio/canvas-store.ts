"use client";

import { create } from "zustand";
import type { PlacedFixture } from "@/lib/planner/types";
import { useProjectStore } from "@/lib/planner/store/project-store";

/**
 * Canvas editing: selection, and undo/redo over the placed fixtures.
 *
 * History lives here rather than in the project because it is a property of
 * this editing session, not of the bathroom. Reopening a saved plan gives you
 * the plan, not somebody's twenty undo steps.
 *
 * Every mutation goes through `commit`, which snapshots the array *before*
 * changing it. That is what makes undo reliable: there is exactly one place
 * where the previous state is captured, so an action cannot forget to.
 */

const LIMIT = 50;

interface CanvasState {
  selectedIndex: number | null;
  past: PlacedFixture[][];
  future: PlacedFixture[][];

  select: (index: number | null) => void;
  /** Apply a change to the fixtures, recording the previous state. */
  commit: (next: PlacedFixture[]) => void;
  undo: () => void;
  redo: () => void;
  /** Drop history — used when the canvas is reset to the chosen layout. */
  clearHistory: () => void;

  canUndo: () => boolean;
  canRedo: () => boolean;
}

function currentFixtures(): PlacedFixture[] {
  const project = useProjectStore.getState().project;
  return project?.placedFixtures ?? project?.plan?.fixtures ?? [];
}

function writeFixtures(fixtures: PlacedFixture[]): void {
  useProjectStore.getState().setPlacedFixtures(fixtures);
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  selectedIndex: null,
  past: [],
  future: [],

  select(index) {
    set({ selectedIndex: index });
  },

  commit(next) {
    const previous = currentFixtures();
    set((s) => ({
      past: [...s.past, previous].slice(-LIMIT),
      future: [],
    }));
    writeFixtures(next);
  },

  undo() {
    const { past } = get();
    if (!past.length) return;
    const previous = past[past.length - 1];
    const current = currentFixtures();
    set((s) => ({
      past: s.past.slice(0, -1),
      future: [current, ...s.future].slice(0, LIMIT),
      // A selection can point past the end of an older, shorter array.
      selectedIndex:
        s.selectedIndex !== null && s.selectedIndex < previous.length ? s.selectedIndex : null,
    }));
    writeFixtures(previous);
  },

  redo() {
    const { future } = get();
    if (!future.length) return;
    const next = future[0];
    const current = currentFixtures();
    set((s) => ({
      past: [...s.past, current].slice(-LIMIT),
      future: s.future.slice(1),
      selectedIndex:
        s.selectedIndex !== null && s.selectedIndex < next.length ? s.selectedIndex : null,
    }));
    writeFixtures(next);
  },

  clearHistory() {
    set({ past: [], future: [], selectedIndex: null });
  },

  canUndo() {
    return get().past.length > 0;
  },

  canRedo() {
    return get().future.length > 0;
  },
}));
