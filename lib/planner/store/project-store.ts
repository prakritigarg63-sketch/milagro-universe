"use client";

import { create } from "zustand";
import type {
  AddOnType,
  ArchitectureStyle,
  CostTier,
  FixtureType,
  FixtureVariant,
  Opening,
  Placement,
  PlacedFixture,
  Project,
  ProjectType,
  PlumbingPoint,
  PlumbingIntent,
  DoorDetail,
  ExtraOpening,
  LayoutOptionId,
  StyleDirection,
  FinishSurface,
  Finishes,
  ProductCategory,
  GeneratedPlan,
  FixtureChoice,
  RoomPreset,
  Unit,
  TileLookChoice,
  LocationChoice,
} from "@/lib/planner/types";
import type { Trade } from "@/lib/planner/data/types";
import { DIM_BOUNDS } from "@/lib/planner/defaults";
import { EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/mixpanel";
import {
  loadOrCreateProject,
  saveProject,
  getProject,
  createProject,
  deleteProject,
} from "@/lib/planner/db";
import { generateLayout } from "@/lib/planner/layout/engine";
import { generateEstimate as computeEstimate } from "@/lib/planner/estimate/engine";

type DimKey = keyof typeof DIM_BOUNDS;

interface ProjectState {
  project: Project | null;
  loading: boolean;
  /** Display unit preference (session-level; not part of the saved project). */
  unit: Unit;
  setUnit: (unit: Unit) => void;

  /** Load the last-opened project (or the most recent), else create a fresh one. */
  loadOrCreate: () => Promise<void>;
  /** Load a specific project by id (used from the My Bathrooms list). */
  loadProject: (id: string) => Promise<void>;
  /** Create a new project and make it current. Returns it (or null on failure). */
  newProject: (name?: string) => Promise<Project | null>;
  /** Delete a project; clears the current one if it was the deleted one. */
  removeProject: (id: string) => Promise<void>;
  hydrate: (project: Project) => void;

  // Studio — what the homeowner is building. Gates which questions we ask.
  setProjectType: (projectType: ProjectType) => void;
  /** Absolute dimension set (inches), for typed entry rather than steppers. */
  setDim: (dim: DimKey, inches: number) => void;
  setDoorDetail: (detail: DoorDetail) => void;
  addExtraOpening: (opening: ExtraOpening) => void;
  updateExtraOpening: (id: string, patch: Partial<ExtraOpening>) => void;
  removeExtraOpening: (id: string) => void;
  setNoWindow: (value: boolean) => void;
  addPlumbingPoint: (point: PlumbingPoint) => void;
  movePlumbingPoint: (id: string, wall: PlumbingPoint["wall"], offsetInches: number) => void;
  removePlumbingPoint: (id: string) => void;
  setPlumbingIntent: (intent: PlumbingIntent) => void;
  /** Commit one of the three suggestions as the working plan. */
  chooseLayout: (id: LayoutOptionId, fixtures: FixtureChoice[], plan: GeneratedPlan) => void;
  /** Canvas edits. The whole array is replaced so undo/redo can snapshot it. */
  setPlacedFixtures: (fixtures: PlacedFixture[]) => void;
  /** Throw away canvas edits and return to the chosen suggestion. */
  resetPlacedFixtures: () => void;
  /** Pick a visual direction. Seeds finishes the homeowner has not set. */
  setStyleDirection: (direction: StyleDirection, preset: Finishes) => void;
  setFinish: (surface: FinishSurface, optionId: string) => void;
  /** Keep a product for a category (Screen 9). */
  setProduct: (category: ProductCategory, optionId: string) => void;

  // Section B — one brand per trade, tile look, and location (stored in blob).
  setBrand: (trade: Trade, name: string) => void;
  setTileLook: (patch: Partial<TileLookChoice>) => void;
  setLocation: (patch: Partial<LocationChoice>) => void;

  // Step 1 — room
  setRoomName: (name: string) => void;
  setPreset: (preset: RoomPreset, name: string) => void;
  adjustDim: (dim: DimKey, delta: number) => void;
  resetDims: () => void;
  setDoor: (opening: Opening) => void;
  setWindow: (opening: Opening | null) => void;
  setFixturePlacement: (type: FixtureType, placement: Placement) => void;

  // Step 3 — fixture specs & add-ons
  setFixtureVariant: (type: FixtureType, variant: FixtureVariant) => void;
  toggleAddOn: (addOn: AddOnType) => void;

  // Step 2 — style & budget
  setArchitecture: (style: ArchitectureStyle) => void;
  setCostTier: (tier: CostTier) => void;
  setBudget: (inr: number) => void;

  // Step 4 — generate the 2D plan from current inputs
  generatePlan: () => void;

  // Step 5 — generate the material + cost estimate
  generateEstimate: () => void;

  // Step 6 — mark the project saved/finalised
  finalize: () => void;

  /**
   * Write the project to the server now and report whether it landed.
   *
   * Every other mutation persists through the 700ms debounce, which is right
   * for a stepper being held down and wrong for a Save button: the user is told
   * the plan is saved, so the write has to have happened, and a failure has to
   * be visible rather than swallowed.
   */
  saveNow: () => Promise<boolean>;
}

function clampDim(dim: DimKey, value: number): number {
  const { min, max } = DIM_BOUNDS[dim];
  return Math.max(min, Math.min(max, value));
}

function dimField(dim: DimKey): "lengthInches" | "widthInches" | "heightInches" {
  return dim === "length" ? "lengthInches" : dim === "width" ? "widthInches" : "heightInches";
}

// Debounced write-through: the UI mutates in-memory instantly (Zustand); the
// project is persisted to the server ~700ms after the last change, so a stepper
// held down or fast typing is one save, not dozens.
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist(project: Project) {
  cancelPersist();
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void saveProject(project).catch(() => {});
  }, 700);
}

/** Drop a pending debounced write, so an explicit save cannot be raced by it. */
function cancelPersist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
}

// Remember which project was last open so a reload reopens it (not just "latest").
const LAST_OPENED_KEY = "milagro.lastProjectId";
function rememberOpened(id: string | null) {
  try {
    if (id) window.localStorage.setItem(LAST_OPENED_KEY, id);
    else window.localStorage.removeItem(LAST_OPENED_KEY);
  } catch {
    /* ignore */
  }
}
function readLastOpened(): string | null {
  try {
    return window.localStorage.getItem(LAST_OPENED_KEY);
  } catch {
    return null;
  }
}

export const useProjectStore = create<ProjectState>((set, get) => {
  /** Apply a mutation to the current project, bump updatedAt, persist (debounced). */
  function mutate(fn: (p: Project) => Project) {
    const current = get().project;
    if (!current) return;
    const next = { ...fn(current), updatedAt: new Date().toISOString() };
    set({ project: next });
    schedulePersist(next);
  }

  return {
    project: null,
    loading: false,
    unit: "imperial",

    setUnit(unit) {
      set({ unit });
    },

    async loadOrCreate() {
      if (get().project || get().loading) return;
      set({ loading: true });
      try {
        const lastId = readLastOpened();
        const project = (lastId && (await getProject(lastId))) || (await loadOrCreateProject());
        rememberOpened(project.id);
        set({ project, loading: false });
      } catch {
        set({ loading: false });
      }
    },

    async loadProject(id) {
      set({ loading: true });
      try {
        const project = await getProject(id);
        if (project) {
          rememberOpened(project.id);
          set({ project, loading: false });
        } else {
          set({ loading: false });
        }
      } catch {
        set({ loading: false });
      }
    },

    async newProject(name) {
      set({ loading: true });
      try {
        const project = await createProject(name?.trim() || "New Bathroom");
        rememberOpened(project.id);
        set({ project, loading: false });
        track(EVENTS.PROJECT_CREATED, { project_id: project.id });
        return project;
      } catch {
        set({ loading: false });
        return null;
      }
    },

    async removeProject(id) {
      try {
        await deleteProject(id);
        track(EVENTS.PROJECT_DELETED, { project_id: id });
      } catch {
        /* ignore */
      }
      if (get().project?.id === id) {
        rememberOpened(null);
        set({ project: null });
      }
    },

    hydrate(project) {
      set({ project });
    },

    setProjectType(projectType) {
      mutate((p) => ({ ...p, projectType }));
    },

    setDim(dim, inches) {
      mutate((p) => ({
        ...p,
        room: { ...p.room, [dimField(dim)]: clampDim(dim, Math.round(inches)) },
      }));
    },

    setDoorDetail(detail) {
      mutate((p) => ({ ...p, doorDetail: detail }));
    },

    addExtraOpening(opening) {
      mutate((p) => ({ ...p, extraOpenings: [...(p.extraOpenings ?? []), opening] }));
    },

    updateExtraOpening(id, patch) {
      mutate((p) => ({
        ...p,
        extraOpenings: (p.extraOpenings ?? []).map((o) => (o.id === id ? { ...o, ...patch } : o)),
      }));
    },

    removeExtraOpening(id) {
      mutate((p) => ({
        ...p,
        extraOpenings: (p.extraOpenings ?? []).filter((o) => o.id !== id),
      }));
    },

    /** Declaring "no window" also drops any already placed, so the plan and the
     *  declaration cannot disagree. Vents are left alone — a windowless
     *  bathroom is exactly the one most likely to need one. */
    setNoWindow(value) {
      mutate((p) => ({
        ...p,
        noWindow: value,
        extraOpenings: value
          ? (p.extraOpenings ?? []).filter((o) => o.kind !== "window")
          : (p.extraOpenings ?? []),
      }));
    },

    addPlumbingPoint(point) {
      mutate((p) => ({ ...p, plumbing: [...(p.plumbing ?? []), point] }));
    },

    movePlumbingPoint(id, wall, offsetInches) {
      mutate((p) => ({
        ...p,
        plumbing: (p.plumbing ?? []).map((pt) =>
          pt.id === id ? { ...pt, wall, offsetInches } : pt,
        ),
      }));
    },

    removePlumbingPoint(id) {
      mutate((p) => ({ ...p, plumbing: (p.plumbing ?? []).filter((pt) => pt.id !== id) }));
    },

    setPlumbingIntent(intent) {
      mutate((p) => ({ ...p, plumbingIntent: intent }));
    },

    chooseLayout(id, fixtures, plan) {
      mutate((p) => ({
        ...p,
        selectedLayoutId: id,
        fixtures,
        plan,
        // The canvas starts from the chosen suggestion; edits diverge from here.
        placedFixtures: plan.fixtures,
        status: p.status === "draft" ? "planned" : p.status,
      }));
    },

    setPlacedFixtures(fixtures) {
      mutate((p) => ({ ...p, placedFixtures: fixtures }));
    },

    resetPlacedFixtures() {
      mutate((p) => ({ ...p, placedFixtures: p.plan?.fixtures ?? [] }));
    },

    setStyleDirection(direction, preset) {
      mutate((p) => ({
        ...p,
        styleDirection: direction,
        // Hand-picked finishes win: a style is a starting point, not a reset.
        finishes: { ...preset, ...(p.finishes ?? {}) },
      }));
    },

    setFinish(surface, optionId) {
      mutate((p) => ({ ...p, finishes: { ...(p.finishes ?? {}), [surface]: optionId } }));
    },

    setProduct(category, optionId) {
      mutate((p) => ({ ...p, products: { ...(p.products ?? {}), [category]: optionId } }));
    },

    setBrand(trade, name) {
      mutate((p) => ({
        ...p,
        tradeBrands: {
          sanitary: null,
          tiles: null,
          electrical: null,
          wiring: null,
          ...(p.tradeBrands ?? {}),
          [trade]: name,
        },
      }));
    },

    setTileLook(patch) {
      mutate((p) => ({
        ...p,
        tileLook: { colour: null, finish: null, ...(p.tileLook ?? {}), ...patch },
      }));
    },

    setLocation(patch) {
      mutate((p) => ({
        ...p,
        location: { lat: null, lng: null, city: null, source: null, ...(p.location ?? {}), ...patch },
      }));
    },

    setRoomName(name) {
      mutate((p) => ({ ...p, room: { ...p.room, name, preset: null } }));
    },

    setPreset(preset, name) {
      mutate((p) => ({ ...p, room: { ...p.room, preset, name } }));
    },

    adjustDim(dim, delta) {
      mutate((p) => {
        const field = dimField(dim);
        return {
          ...p,
          room: { ...p.room, [field]: clampDim(dim, p.room[field] + delta) },
        };
      });
    },

    resetDims() {
      mutate((p) => ({
        ...p,
        room: { ...p.room, lengthInches: 102, widthInches: 72, heightInches: 108 },
      }));
    },

    setDoor(opening) {
      mutate((p) => ({ ...p, room: { ...p.room, door: opening } }));
    },

    setWindow(opening) {
      mutate((p) => ({ ...p, room: { ...p.room, window: opening } }));
    },

    setFixturePlacement(type, placement) {
      mutate((p) => ({
        ...p,
        fixtures: p.fixtures.map((f) => (f.type === type ? { ...f, placement } : f)),
      }));
    },

    setFixtureVariant(type, variant) {
      mutate((p) => ({
        ...p,
        fixtures: p.fixtures.map((f) => (f.type === type ? { ...f, variant } : f)),
      }));
    },

    toggleAddOn(addOn) {
      mutate((p) => ({
        ...p,
        addOns: p.addOns.includes(addOn)
          ? p.addOns.filter((a) => a !== addOn)
          : [...p.addOns, addOn],
      }));
    },

    setArchitecture(style) {
      mutate((p) => ({ ...p, style: { ...p.style, architecture: style } }));
    },

    setCostTier(tier) {
      mutate((p) => ({ ...p, style: { ...p.style, costTier: tier }, tierChosen: true }));
    },

    setBudget(inr) {
      mutate((p) => ({ ...p, style: { ...p.style, budgetInr: inr } }));
    },

    generatePlan() {
      mutate((p) => ({
        ...p,
        plan: generateLayout(p.room, p.fixtures),
        status: p.status === "draft" ? "planned" : p.status,
      }));
    },

    generateEstimate() {
      mutate((p) => ({
        ...p,
        estimate: computeEstimate(p.room, p.style, p.fixtures, p.addOns),
      }));
    },

    finalize() {
      // Saving is not sharing. "shared" is what My Bathrooms reads as "Shared
      // with contractor", and pressing Save has never told a contractor
      // anything — that belongs to the invite flow.
      mutate((p) => ({ ...p, status: "planned" }));
    },

    async saveNow() {
      const project = get().project;
      if (!project) return false;
      cancelPersist();
      try {
        await saveProject(project);
        return true;
      } catch {
        return false;
      }
    },
  };
});
