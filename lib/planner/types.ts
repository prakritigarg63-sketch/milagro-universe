/**
 * Milagro Universe domain model — the shared vocabulary for the whole app.
 * All physical measurements are stored in INCHES internally; unit display
 * (imperial/metric) is a presentation concern handled at the edges.
 */

export type Language = "en" | "hi";
export type Theme = "light" | "dark";
export type Unit = "imperial" | "metric";

/** The four walls of a rectangular room, from the plan's point of view. */
export type Wall = "back" | "front" | "left" | "right";

/** Placement / variant a fixture can take. Walls plus special spots and the
 *  shower variants shown in the wizard. */
export type Placement =
  | Wall
  | "nearEntry"
  | "underVanity"
  | "dryCorner"
  | "wallRecess"
  | "walkIn"
  | "enclosed"
  | "tubCombo";

export type RoomPreset = "master" | "guest" | "kids" | "powder";

export type FixtureType = "wc" | "vanity" | "shower" | "almirah";

/** Type/variant of a fixture (Step 3 — deeper spec that feeds the BOM). */
export type FixtureVariant =
  // wc
  | "wallHung"
  | "floorMounted"
  | "smart"
  // vanity / basin
  | "countertop"
  | "wallHungBasin"
  | "pedestal"
  // shower
  | "rainShower"
  | "handheld"
  | "showerPanel"
  // almirah
  | "mirrorCabinet"
  | "openShelf"
  | "tallUnit";

/** Optional add-on elements the homeowner can include (Step 3). */
export type AddOnType =
  | "geyser"
  | "exhaustFan"
  | "towelRail"
  | "healthFaucet"
  | "floorDrain"
  | "niche";

export type ArchitectureStyle = "modern" | "traditional" | "minimal" | "luxury";

/** Cost tiers offered to the homeowner (Step 2). */
export type CostTier = "budget" | "costEffective" | "goodQuality" | "topOfLine";

/** A door or window on a given wall, positioned by its centre offset (inches)
 *  from that wall's starting corner, with an opening width. */
export interface Opening {
  wall: Wall;
  offsetInches: number;
  widthInches: number;
}

export interface Room {
  name: string;
  preset: RoomPreset | null;
  lengthInches: number;
  widthInches: number;
  heightInches: number;
  door: Opening;
  window: Opening | null;
}

/** A fixture the homeowner wants, its placement, and (Step 3) its type/variant. */
export interface FixtureChoice {
  type: FixtureType;
  placement: Placement;
  variant?: FixtureVariant;
}

export interface StyleChoice {
  architecture: ArchitectureStyle;
  costTier: CostTier;
  budgetInr: number;
}

/** Output of the layout engine: a fixture positioned in room-inch coordinates.
 *  Origin (0,0) is the back-left corner; x runs along length, y along width. */
export interface PlacedFixture {
  type: FixtureType;
  x: number;
  y: number;
  widthInches: number;
  depthInches: number;
  /** rotation in degrees, clockwise */
  rotation: number;
}

export interface ClearanceWarning {
  fixture: FixtureType;
  code: string;
  message: string;
  severity: "warning" | "error";
}

export interface GeneratedPlan {
  fixtures: PlacedFixture[];
  warnings: ClearanceWarning[];
  archetype: string;
}

/** A single line in the bill of materials. */
export interface BomLine {
  key: string;
  label: string;
  quantity: number;
  unit: string;
  unitCostInr: number;
  totalInr: number;
}

export interface Estimate {
  bom: BomLine[];
  materialCostInr: number;
  labourCostInr: number;
  totalCostInr: number;
  timeDays: number;
}

export type ProjectRole = "owner" | "expert";

export interface ProjectMember {
  userId: string;
  role: ProjectRole;
}

export type ProjectStatus = "draft" | "planned" | "shared";

export interface Project extends StudioFields {
  id: string;
  ownerId: string;
  members: ProjectMember[];
  status: ProjectStatus;
  room: Room;
  style: StyleChoice;
  fixtures: FixtureChoice[];
  addOns: AddOnType[];
  plan: GeneratedPlan | null;
  estimate: Estimate | null;
  createdAt: string;
  updatedAt: string;
}

/* ---------------------------------------------------------------------------
   Studio additions.

   The guided /planner journey (project type → estimate) needs state the
   original wizard never captured. Everything here is OPTIONAL on `Project` so
   projects saved by the earlier wizard still load and still typecheck; the
   studio fills the gaps via `withStudioDefaults()` in defaults.ts.
--------------------------------------------------------------------------- */

/** What the homeowner is actually doing. Drives which questions we ask —
 *  a new build has no existing plumbing to keep. */
export type ProjectType = "newBuild" | "renovation" | "redesign";

/** How willing the homeowner is to move existing plumbing (renovation only).
 *  Keeping outlets where they are is the single biggest cost lever. */
export type PlumbingIntent = "keepExisting" | "openToMoving" | "notSure";

export type PlumbingPointType = "wcOutlet" | "basinPoint" | "showerPoint" | "waterInlet";

/** A fixed service point on a wall, positioned like an Opening. */
export interface PlumbingPoint {
  id: string;
  type: PlumbingPointType;
  wall: Wall;
  offsetInches: number;
}

/** Openings beyond the room's primary door/window — extra windows and vents. */
export type ExtraOpeningKind = "window" | "vent";

export interface ExtraOpening extends Opening {
  id: string;
  kind: ExtraOpeningKind;
  /** Windows only: pane height and sill height above floor, in inches. */
  heightInches?: number;
  sillHeightInches?: number;
}

/** Door detail the original Opening did not carry. */
export type DoorHinge = "left" | "right";
export type DoorSwing = "in" | "out";

export interface DoorDetail {
  hinge: DoorHinge;
  swing: DoorSwing;
}

/** The three suggestions offered on the layout screen. */
export type LayoutOptionId = "balanced" | "open" | "storage";

/** Visual direction, distinct from the structural `ArchitectureStyle` the
 *  estimate engine reads. Maps onto it via `architectureForDirection()`. */
export type StyleDirection =
  | "warmMinimal"
  | "modernLuxe"
  | "naturalEarthy"
  | "cleanContemporary"
  | "classic";

export type ProductCategory =
  | "wc"
  | "basin"
  | "shower"
  | "faucets"
  | "storage"
  | "tiles"
  | "accessories";

/** Where an alternative sits relative to the recommended pick. */
export type ProductBand = "save" | "recommended" | "upgrade";

export interface ProductOption {
  id: string;
  category: ProductCategory;
  name: string;
  brand: string;
  /** Indicative only — seeded prototype data, never a live quote. */
  indicativePriceInr: number;
  band: ProductBand;
  /** Short homeowner-facing reasons this fits their project. */
  whyItFits: string[];
}

/** The homeowner's pick per category: which option id they kept. */
export type ProductSelections = Partial<Record<ProductCategory, string>>;

/** A material line for the "what your design may need" summary. */
export interface MaterialLine {
  key: string;
  label: string;
  quantity: number;
  unit: string;
  /** Recommended over-order allowance, as a fraction (0.1 = +10%). */
  bufferPct?: number;
}

export interface MaterialGroup {
  key: "tiles" | "plumbing" | "fixtures" | "construction" | "accessories";
  label: string;
  lines: MaterialLine[];
}

/** Everything the studio adds to a project. Spread onto `Project` as optional
 *  fields rather than nested, so `project.projectType` reads naturally. */
export interface StudioFields {
  /**
   * Whether the homeowner has actually picked a spending tier.
   *
   * `style.costTier` always holds a usable value so the screens before this
   * one have something to price against. That makes it useless for deciding
   * whether the question has been answered — this says so explicitly.
   */
  tierChosen?: boolean;
  projectType?: ProjectType;
  doorDetail?: DoorDetail;
  extraOpenings?: ExtraOpening[];
  /**
   * Set when the room has no window at all.
   *
   * Distinct from "no window has been placed yet", which is the same absence
   * for an entirely different reason. Without this the step cannot tell a
   * windowless bathroom from an unfinished one, so it has to keep asking.
   */
  noWindow?: boolean;
  plumbing?: PlumbingPoint[];
  plumbingIntent?: PlumbingIntent;
  selectedLayoutId?: LayoutOptionId;
  /** The canvas state — user-moved fixtures. Falls back to `plan.fixtures`. */
  placedFixtures?: PlacedFixture[];
  styleDirection?: StyleDirection;
  finishes?: Finishes;
  products?: ProductSelections;
}

/** Surfaces and elements the homeowner can restyle on the visualize screen. */
export type FinishSurface =
  | "floor"
  | "walls"
  | "tiles"
  | "vanity"
  | "shower"
  | "wc"
  | "fittings"
  | "lighting";

/** Chosen option id per surface, e.g. { floor: "warmTravertine" }. */
export type Finishes = Partial<Record<FinishSurface, string>>;
