import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type {
  AddOnType,
  ArchitectureStyle,
  FixtureChoice,
  GeneratedPlan,
  PlacedFixture,
  Room,
  Wall,
} from "@/lib/planner/types";
import type { BuildProgress } from "@/lib/planner/build/phases";
import { IN, STYLE_KITS, makeTileTexture, mergeKit, tiledFor, type ScenePalette, type TileSpec } from "./textures";
import { buildAddOn, buildFixture, makeKitMaterials, mesh, type KitMaterials } from "./fixtures";

export interface SceneModel {
  room: Room;
  plan: GeneratedPlan;
  fixtures: FixtureChoice[];
  style: ArchitectureStyle;
  addOns: AddOnType[];
  /** Optional finish overrides so the render reflects the user's design picks. */
  palette?: ScenePalette;
}

/*
 * The 4D plan's scene. One owner for renderer, scene, camera, controls, the
 * animation frame, resize and disposal; React only calls setModel, setProgress,
 * resetView and dispose.
 *
 * World frame: metres, Y up, room centred on the origin. Plan x (length) maps
 * to world X, plan y (width) to world Z, so the back wall sits at z = -W/2.
 */

const T = 0.1; // wall thickness
const TILE_T = 0.012;
const DOOR_H = 80 * IN;
const SILL = 42 * IN;
const WIN_H = 36 * IN;
/** Height a wall drops to when it stands between the camera and the room. */
const CUT = 0.14;
const WALLS: Wall[] = ["back", "front", "left", "right"];
const WALL_OF_ROTATION: Record<number, Wall> = { 0: "back", 180: "front", 90: "left", 270: "right" };

interface WallFrame {
  wall: Wall;
  len: number;
  origin: THREE.Vector3;
  along: THREE.Vector3;
  inward: THREE.Vector3;
}

interface Hole {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
}

interface Rect {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (v: number) => 1 - Math.pow(1 - v, 3);

function frameFor(wall: Wall, L: number, W: number): WallFrame {
  switch (wall) {
    case "back":
      return { wall, len: L, origin: new THREE.Vector3(-L / 2, 0, -W / 2), along: new THREE.Vector3(1, 0, 0), inward: new THREE.Vector3(0, 0, 1) };
    case "front":
      return { wall, len: L, origin: new THREE.Vector3(-L / 2, 0, W / 2), along: new THREE.Vector3(1, 0, 0), inward: new THREE.Vector3(0, 0, -1) };
    case "left":
      return { wall, len: W, origin: new THREE.Vector3(-L / 2, 0, -W / 2), along: new THREE.Vector3(0, 0, 1), inward: new THREE.Vector3(1, 0, 0) };
    case "right":
      return { wall, len: W, origin: new THREE.Vector3(L / 2, 0, -W / 2), along: new THREE.Vector3(0, 0, 1), inward: new THREE.Vector3(-1, 0, 0) };
  }
}

/** Solid rectangles of a wall of length [from, to] × [0, h] with openings cut out. */
function wallRects(from: number, to: number, h: number, holes: Hole[]): Rect[] {
  const cuts = Array.from(new Set([from, to, ...holes.flatMap((o) => [o.u0, o.u1])]))
    .filter((c) => c >= from && c <= to)
    .sort((a, b) => a - b);
  const rects: Rect[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i];
    const b = cuts[i + 1];
    if (b - a < 1e-4) continue;
    const hole = holes.find((o) => o.u0 < b - 1e-4 && o.u1 > a + 1e-4);
    if (!hole) {
      rects.push({ u0: a, u1: b, v0: 0, v1: h });
      continue;
    }
    if (hole.v0 > 1e-4) rects.push({ u0: a, u1: b, v0: 0, v1: hole.v0 });
    if (hole.v1 < h - 1e-4) rects.push({ u0: a, u1: b, v0: hole.v1, v1: h });
  }
  return rects;
}

/** A point on a wall: `u` along it, `v` up, `n` out from its inner face. */
function onWall(f: WallFrame, u: number, v: number, n: number): THREE.Vector3 {
  return f.origin.clone().addScaledVector(f.along, u).setY(v).addScaledVector(f.inward, n);
}

function panel(f: WallFrame, r: Rect, thickness: number, n: number, mat: THREE.Material): THREE.Mesh {
  const geo = new THREE.BoxGeometry(r.u1 - r.u0, r.v1 - r.v0, thickness);
  const m = mesh(geo, mat);
  m.position.copy(onWall(f, (r.u0 + r.u1) / 2, (r.v0 + r.v1) / 2, n));
  if (f.along.z !== 0) m.rotation.y = Math.PI / 2;
  return m;
}

/** A cylinder from a to b whose scale.y grows it from a. */
function pipe(a: THREE.Vector3, b: THREE.Vector3, radius: number, mat: THREE.Material): THREE.Mesh {
  const dir = b.clone().sub(a);
  const len = Math.max(0.001, dir.length());
  const geo = new THREE.CylinderGeometry(radius, radius, len, 14);
  geo.translate(0, len / 2, 0);
  const m = mesh(geo, mat);
  m.position.copy(a);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

interface Built {
  root: THREE.Group;
  frames: Record<Wall, WallFrame>;
  wallGroups: Record<Wall, THREE.Group>;
  wallHeight: number;
  roomL: number;
  shellMat: THREE.MeshStandardMaterial;
  kitMasonry: THREE.Color;
  kitPlaster: THREE.Color;
  wallTiles: THREE.Object3D[];
  floorTiles: THREE.Object3D;
  membraneMat: THREE.MeshStandardMaterial;
  membrane: THREE.Object3D[];
  pipeMats: THREE.MeshStandardMaterial[];
  pipes: THREE.Mesh[];
  marksMat: THREE.LineBasicMaterial;
  marks: THREE.Object3D[];
  fixtures: { group: THREE.Group; late: THREE.Object3D[]; baseY: number }[];
  finishing: THREE.Object3D[];
  glow: THREE.MeshStandardMaterial;
  lamp: THREE.PointLight;
  textures: THREE.Texture[];
  materials: THREE.Material[];
}

export class BathroomScene {
  private host: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, 0.05, 80);
  private controls: OrbitControls;
  private envTexture: THREE.Texture;
  private sun: THREE.DirectionalLight;
  private wallClip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  private floorClip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  private built: Built | null = null;
  /** The camera is framed once; later model edits keep the user's view. */
  private framed = false;
  private progress: BuildProgress | null = null;
  private raf = 0;
  private dirty = true;
  private visible = true;
  private resizeObserver: ResizeObserver;
  private intersection: IntersectionObserver;
  private reducedMotion: boolean;

  constructor(host: HTMLElement, opts: { reducedMotion: boolean }) {
    this.host = host;
    this.reducedMotion = opts.reducedMotion;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.localClippingEnabled = true;
    const canvas = this.renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    host.appendChild(canvas);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = this.envTexture;
    this.scene.environmentIntensity = 0.6;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8f887d, 0.55));
    this.sun = new THREE.DirectionalLight(0xfff4e6, 1.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.radius = 4;
    this.scene.add(this.sun, this.sun.target);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = !this.reducedMotion;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minPolarAngle = 0.25;
    this.controls.maxPolarAngle = 1.32;
    this.controls.addEventListener("change", () => {
      this.dirty = true;
    });

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.intersection = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.dirty = true;
    });
    this.intersection.observe(host);
    this.resize();
    this.tick();
  }

  setModel(model: SceneModel) {
    this.disposeBuilt();
    this.built = this.build(model);
    this.scene.add(this.built.root);
    if (!this.framed) {
      this.resetView();
      this.framed = true;
    }
    if (this.progress) this.applyProgress(this.progress);
    this.dirty = true;
  }

  setProgress(progress: BuildProgress) {
    this.progress = progress;
    if (this.built) this.applyProgress(progress);
    this.dirty = true;
  }

  resetView() {
    if (!this.built) return;
    const L = this.built.roomL;
    const H = this.built.wallHeight;
    const size = Math.max(L, H, 2);
    const r = size * 1.5;
    this.controls.target.set(0, H * 0.32, 0);
    this.camera.position.set(r * 0.62, r * 0.72, r * 0.92);
    this.controls.minDistance = size * 0.7;
    this.controls.maxDistance = size * 3.2;
    this.controls.update();
    this.dirty = true;
  }

  /**
   * A PNG snapshot of the current view at a chosen resolution.
   *
   * Renders once and reads the canvas back in the *same* synchronous call, so it
   * works even though the renderer has no `preserveDrawingBuffer` — the browser
   * only clears the drawing buffer once control returns to it. The on-screen size
   * is restored immediately after, so the live view the user is orbiting is
   * untouched. Captures exactly the angle they have framed.
   */
  capture(width: number, height: number): string {
    const prev = new THREE.Vector2();
    this.renderer.getSize(prev);
    const prevRatio = this.renderer.getPixelRatio();

    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL("image/png");

    this.renderer.setPixelRatio(prevRatio);
    this.renderer.setSize(prev.x, prev.y, false);
    this.camera.aspect = prev.x / prev.y || 1;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
    return url;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.intersection.disconnect();
    this.controls.dispose();
    this.disposeBuilt();
    this.envTexture.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // ---------------------------------------------------------------------------

  private resize() {
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);
    if (!this.visible) return;
    const moved = this.controls.update();
    const cut = this.updateCutaway();
    if (moved || cut || this.dirty) {
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    }
  };

  /** Lower whichever walls stand between the camera and the room. */
  private updateCutaway(): boolean {
    const b = this.built;
    if (!b) return false;
    let changed = false;
    for (const wall of WALLS) {
      const f = b.frames[wall];
      const centre = onWall(f, f.len / 2, 0, 0);
      const toCamera = this.camera.position.clone().sub(centre);
      const target = toCamera.dot(f.inward) < 0 ? CUT : 1;
      const g = b.wallGroups[wall];
      const next = this.reducedMotion ? target : g.scale.y + (target - g.scale.y) * 0.18;
      if (Math.abs(next - g.scale.y) > 0.0005) {
        g.scale.y = Math.abs(next - target) < 0.002 ? target : next;
        changed = true;
      }
    }
    return changed;
  }

  private applyProgress(p: BuildProgress) {
    const b = this.built;
    if (!b) return;

    // Prep: masonry is plastered; the layout is chalked onto the floor.
    b.shellMat.color.copy(b.kitMasonry).lerp(b.kitPlaster, p.prep);
    const markOpacity = p.prep * (1 - clamp01(p.tiling * 2));
    b.marksMat.opacity = markOpacity;
    for (const m of b.marks) m.visible = markOpacity > 0.01;

    // Plumbing: runs grow one after another; tiling then covers them.
    const n = b.pipes.length;
    const coverage = 1 - clamp01(p.tiling * 1.6);
    for (const mat of b.pipeMats) {
      mat.opacity = coverage;
      mat.transparent = coverage < 0.999;
      mat.depthWrite = coverage > 0.5;
    }
    b.pipes.forEach((m, i) => {
      const grow = clamp01(p.plumbing * n - i);
      m.visible = grow > 0.001 && coverage > 0.01;
      m.scale.y = Math.max(0.001, grow);
    });

    // Waterproofing: the membrane goes on, then disappears under tile.
    const membrane = p.waterproofing * coverage;
    b.membraneMat.opacity = membrane * 0.9;
    for (const m of b.membrane) m.visible = membrane > 0.01;

    // Tiling: the floor fills across the room, then the walls rise.
    const floorT = clamp01(p.tiling * 2);
    const wallT = clamp01(p.tiling * 2 - 1);
    this.floorClip.constant = -b.roomL / 2 + floorT * b.roomL;
    b.floorTiles.visible = floorT > 0.001;
    this.wallClip.constant = wallT * b.wallHeight;
    for (const t of b.wallTiles) t.visible = wallT > 0.001;

    // Fixtures: each one settles into place in turn.
    const count = b.fixtures.length;
    b.fixtures.forEach((f, i) => {
      const k = easeOut(clamp01(p.fixtures * count - i));
      f.group.visible = k > 0.001;
      f.group.scale.setScalar(0.9 + 0.1 * k);
      f.group.position.y = f.baseY + (1 - k) * 0.3;
      f.late.forEach((part, j) => {
        part.visible = p.finishing > 0.2 + (0.5 * j) / Math.max(1, f.late.length);
      });
    });

    // Finishing: fittings, glass, mirror, and the lights come on.
    b.finishing.forEach((part, i) => {
      part.visible = p.finishing > 0.15 + (0.6 * i) / Math.max(1, b.finishing.length);
    });
    b.glow.emissiveIntensity = p.finishing * 2.2;
    b.lamp.intensity = p.finishing * 2.4;
    this.renderer.toneMappingExposure = 1 + p.finishing * 0.08;
  }

  private build(model: SceneModel): Built {
    const { room, plan, fixtures, style, addOns } = model;
    const kit = mergeKit(STYLE_KITS[style], model.palette);
    const L = room.lengthInches * IN;
    const W = room.widthInches * IN;
    const H = room.heightInches * IN;
    const anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    const textures: THREE.Texture[] = [];
    const materials: THREE.Material[] = [];
    const track = <M extends THREE.Material>(m: M) => {
      materials.push(m);
      return m;
    };

    const floorTex = makeTileTexture(kit.floor, 11, anisotropy);
    const wallTex = makeTileTexture(kit.wall, 23, anisotropy);
    const featureTex = makeTileTexture(kit.feature, 37, anisotropy);
    const counterTex = makeTileTexture(kit.counter, 41, anisotropy);
    textures.push(floorTex, wallTex, featureTex, counterTex);
    const M: KitMaterials = makeKitMaterials(kit, counterTex);
    Object.values(M).forEach((m) => materials.push(m));

    const root = new THREE.Group();
    const shellMat = track(new THREE.MeshStandardMaterial({ color: kit.masonry, roughness: 0.92 }));
    const slabMat = track(new THREE.MeshStandardMaterial({ color: "#8f8a82", roughness: 0.95 }));

    // Ground contact shadow + floor slab.
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      track(new THREE.ShadowMaterial({ opacity: 0.14 })),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    root.add(ground);
    root.add(mesh(new THREE.BoxGeometry(L + 2 * T, 0.1, W + 2 * T), slabMat, 0, -0.05, 0));

    // Where each fixture landed, in wall terms.
    const wallOf = (p: PlacedFixture): Wall => WALL_OF_ROTATION[((p.rotation % 360) + 360) % 360] ?? "back";
    const alongOf = (p: PlacedFixture): number => {
      const w = wallOf(p);
      return (w === "back" || w === "front" ? p.x + p.widthInches / 2 : p.y + p.depthInches / 2) * IN;
    };
    const shower = plan.fixtures.find((f) => f.type === "shower");
    const showerWall = shower ? wallOf(shower) : null;

    const frames = {} as Record<Wall, WallFrame>;
    const wallGroups = {} as Record<Wall, THREE.Group>;
    const wallTiles: THREE.Object3D[] = [];
    const membrane: THREE.Object3D[] = [];
    const membraneMat = track(new THREE.MeshStandardMaterial({ color: "#6f7d74", roughness: 0.85, transparent: true, opacity: 0 }));
    const finishing: THREE.Object3D[] = [];

    const wallTileMat = (spec: TileSpec, base: THREE.Texture, r: Rect) => {
      const map = tiledFor(base, spec, r.u1 - r.u0, r.v1 - r.v0, r.u0, r.v0);
      textures.push(map);
      return track(
        new THREE.MeshStandardMaterial({
          map,
          roughness: spec.roughness,
          clippingPlanes: [this.wallClip],
          clipShadows: true,
        }),
      );
    };

    for (const wall of WALLS) {
      const f = frameFor(wall, L, W);
      frames[wall] = f;
      const g = new THREE.Group();
      wallGroups[wall] = g;
      root.add(g);

      const holes: Hole[] = [];
      const openingHole = (offsetIn: number, widthIn: number, v0: number, v1: number): Hole => ({
        u0: (offsetIn - widthIn / 2) * IN,
        u1: (offsetIn + widthIn / 2) * IN,
        v0,
        v1,
      });
      if (room.door.wall === wall) holes.push(openingHole(room.door.offsetInches, room.door.widthInches, 0, DOOR_H));
      if (room.window?.wall === wall) holes.push(openingHole(room.window.offsetInches, room.window.widthInches, SILL, SILL + WIN_H));

      // Masonry shell; the long walls run past the corners to close them.
      const ext = wall === "back" || wall === "front" ? T : 0;
      for (const r of wallRects(-ext, f.len + ext, H, holes)) g.add(panel(f, r, T, -T / 2, shellMat));

      // Tile skin on the inner face.
      const isFeature = wall === showerWall;
      for (const r of wallRects(0, f.len, H, holes)) {
        const tile = panel(f, r, TILE_T, TILE_T / 2, wallTileMat(isFeature ? kit.feature : kit.wall, isFeature ? featureTex : wallTex, r));
        tile.visible = false;
        wallTiles.push(tile);
        g.add(tile);
      }

      // Opening frames: fitted at finishing.
      for (const hole of holes) {
        const frameMat = hole.v0 === 0 ? M.wood : M.metal;
        const bar = 0.04;
        const parts = [
          panel(f, { u0: hole.u0 - bar, u1: hole.u0, v0: hole.v0, v1: hole.v1 }, T + 0.02, -T / 2, frameMat),
          panel(f, { u0: hole.u1, u1: hole.u1 + bar, v0: hole.v0, v1: hole.v1 }, T + 0.02, -T / 2, frameMat),
          panel(f, { u0: hole.u0 - bar, u1: hole.u1 + bar, v0: hole.v1, v1: hole.v1 + bar }, T + 0.02, -T / 2, frameMat),
        ];
        if (hole.v0 > 0) {
          const pane = panel(f, { u0: hole.u0, u1: hole.u1, v0: hole.v0, v1: hole.v1 }, 0.01, -T / 2, M.glass);
          pane.castShadow = false;
          parts.push(pane);
        }
        for (const part of parts) {
          part.visible = false;
          finishing.push(part);
          g.add(part);
        }
      }
    }

    // Floor tiles.
    const floorMap = tiledFor(floorTex, kit.floor, L, W);
    textures.push(floorMap);
    const floorTiles = mesh(
      new THREE.BoxGeometry(L, 0.02, W),
      track(new THREE.MeshStandardMaterial({ map: floorMap, roughness: kit.floor.roughness, clippingPlanes: [this.floorClip], clipShadows: true })),
      0,
      0.01,
      0,
    );
    floorTiles.visible = false;
    root.add(floorTiles);

    // Membrane: the whole floor, plus the wet wall to 1.9 m.
    const floorMembrane = mesh(new THREE.BoxGeometry(L, 0.004, W), membraneMat, 0, 0.004, 0);
    floorMembrane.visible = false;
    membrane.push(floorMembrane);
    root.add(floorMembrane);
    if (shower && showerWall) {
      const f = frames[showerWall];
      const half = (Math.max(shower.widthInches, shower.depthInches) * IN) / 2 + 0.3;
      const c = alongOf(shower);
      const m = panel(f, { u0: Math.max(0, c - half), u1: Math.min(f.len, c + half), v0: 0, v1: 1.9 }, 0.004, 0.003, membraneMat);
      m.visible = false;
      membrane.push(m);
      wallGroups[showerWall].add(m);
    }

    // Plumbing runs to every wet point.
    const supplyMat = track(new THREE.MeshStandardMaterial({ color: "#e8dbbd", roughness: 0.5 }));
    const drainMat = track(new THREE.MeshStandardMaterial({ color: "#7f858c", roughness: 0.6 }));
    const pipes: THREE.Mesh[] = [];
    const connectHeight: Partial<Record<string, number>> = { wc: 0.25, vanity: 0.55, shower: 1.05 };
    const drainPoint = shower
      ? new THREE.Vector3((shower.x + shower.widthInches / 2) * IN - L / 2, 0.03, (shower.y + shower.depthInches / 2) * IN - W / 2)
      : new THREE.Vector3(0, 0.03, 0);
    for (const p of plan.fixtures) {
      const h = connectHeight[p.type];
      if (h === undefined) continue;
      const wall = wallOf(p);
      const f = frames[wall];
      const u = alongOf(p);
      const header = pipe(onWall(f, 0.05, 0.3, 0.02), onWall(f, u, 0.3, 0.02), 0.012, supplyMat);
      const riser = pipe(onWall(f, u, 0.3, 0.02), onWall(f, u, h, 0.02), 0.012, supplyMat);
      wallGroups[wall].add(header, riser);
      pipes.push(header, riser);
      if (p.type !== "shower") {
        const start = onWall(f, u, 0.03, 0.12);
        const corner = new THREE.Vector3(drainPoint.x, 0.03, start.z);
        const legA = pipe(start, corner, 0.028, drainMat);
        const legB = pipe(corner, drainPoint, 0.028, drainMat);
        root.add(legA, legB);
        pipes.push(legA, legB);
      }
    }
    if (addOns.includes("geyser") && shower && showerWall) {
      const f = frames[showerWall];
      const u = Math.min(f.len - 0.4, alongOf(shower) + 0.35);
      const hot = pipe(onWall(f, u, 1.05, 0.02), onWall(f, u, 1.9, 0.02), 0.012, supplyMat);
      wallGroups[showerWall].add(hot);
      pipes.push(hot);
    }
    for (const m of pipes) m.visible = false;

    // Layout marks on the floor.
    const marksMat = track(new THREE.LineBasicMaterial({ color: "#8a5a2b", transparent: true, opacity: 0 }));
    const marks: THREE.Object3D[] = [];
    for (const p of plan.fixtures) {
      const w = p.widthInches * IN;
      const d = p.depthInches * IN;
      const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, d)), marksMat);
      outline.rotation.x = -Math.PI / 2;
      outline.position.set(p.x * IN + w / 2 - L / 2, 0.026, p.y * IN + d / 2 - W / 2);
      outline.visible = false;
      marks.push(outline);
      root.add(outline);
    }

    // Fixtures, in the order the layout engine placed them.
    const built: Built["fixtures"] = [];
    plan.fixtures.forEach((p, index) => {
      const wall = wallOf(p);
      const alongIn = wall === "back" || wall === "front" ? p.widthInches : p.depthInches;
      const fromIn = wall === "back" || wall === "front" ? p.depthInches : p.widthInches;
      const choice = fixtures.find((c) => c.type === p.type);
      const fx = buildFixture(p.type, alongIn * IN, fromIn * IN, choice?.variant, choice?.placement ?? "back", M);
      fx.group.position.set((p.x + p.widthInches / 2) * IN - L / 2, 0.02, (p.y + p.depthInches / 2) * IN - W / 2);
      fx.group.rotation.y = THREE.MathUtils.degToRad(p.rotation);
      fx.group.visible = false;
      fx.group.userData.order = index;
      root.add(fx.group);
      built.push({ group: fx.group, late: fx.late, baseY: 0.02 });
    });

    // Add-ons, mounted relative to the fixtures they serve.
    const anchor = (type: string) => plan.fixtures.find((f) => f.type === type);
    for (const a of addOns) {
      const host = anchor(a === "healthFaucet" ? "wc" : a === "towelRail" ? "vanity" : "shower") ?? plan.fixtures[0];
      if (!host) continue;
      const wall = wallOf(host);
      const f = frames[wall];
      const offsets: Partial<Record<AddOnType, number>> = { geyser: 0.35, exhaustFan: -0.45, towelRail: 0.7, healthFaucet: 0.35, niche: -0.1, floorDrain: 0 };
      const u = Math.min(f.len - 0.3, Math.max(0.3, alongOf(host) + (offsets[a] ?? 0)));
      const obj = buildAddOn(a, M);
      obj.position.copy(onWall(f, u, 0, TILE_T));
      obj.rotation.y = Math.atan2(f.inward.x, f.inward.z);
      obj.visible = false;
      finishing.push(obj);
      if (a === "floorDrain") root.add(obj);
      else wallGroups[wall].add(obj);
    }

    // Warm light that comes on at handover, near the basin.
    const vanity = anchor("vanity");
    const lamp = new THREE.PointLight(kit.light, 0, 4, 1.6);
    const lampPos = vanity
      ? onWall(frames[wallOf(vanity)], alongOf(vanity), 1.9, 0.5)
      : new THREE.Vector3(0, H * 0.8, 0);
    lamp.position.copy(lampPos);
    root.add(lamp);

    // Sunlight through the window (or from above the back wall).
    const winFrame = room.window ? frames[room.window.wall] : frames.back;
    const winU = room.window ? room.window.offsetInches * IN : L / 2;
    const sunFrom = onWall(winFrame, winU, H * 1.8, -3.5);
    this.sun.position.copy(sunFrom);
    this.sun.target.position.set(0, 0, 0);
    const span = Math.max(L, W, H) * 1.2;
    Object.assign(this.sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 0.5, far: 20 });
    this.sun.shadow.camera.updateProjectionMatrix();

    const result: Built = {
      root,
      frames,
      wallGroups,
      wallHeight: H,
      roomL: L,
      shellMat,
      kitMasonry: new THREE.Color(kit.masonry),
      kitPlaster: new THREE.Color(kit.plaster),
      wallTiles,
      floorTiles,
      membraneMat,
      membrane,
      pipeMats: [supplyMat, drainMat],
      pipes,
      marksMat,
      marks,
      fixtures: built,
      finishing,
      glow: M.glow,
      lamp,
      textures,
      materials,
    };

    return result;
  }

  private disposeBuilt() {
    const b = this.built;
    if (!b) return;
    this.scene.remove(b.root);
    b.root.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) o.geometry.dispose();
    });
    for (const m of b.materials) m.dispose();
    for (const t of b.textures) t.dispose();
    this.built = null;
  }
}
