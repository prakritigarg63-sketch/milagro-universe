"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FloorPlanSvg } from "@/components/planner/sections/FloorPlanSvg";
import { useT } from "@/lib/i18n/useT";
import { generateLayout } from "@/lib/planner/layout/engine";
import { optionFor } from "@/lib/planner/studio/finishes";
import type { Project } from "@/lib/planner/types";
import type { BathroomScene } from "@/components/planner/plan3d/BathroomScene";
import type { ScenePalette } from "@/components/planner/plan3d/textures";
import type { BuildProgress } from "@/lib/planner/build/phases";

/** The completed bathroom — every build phase at 100%. */
const FINISHED: BuildProgress = {
  prep: 1,
  plumbing: 1,
  waterproofing: 1,
  tiling: 1,
  fixtures: 1,
  finishing: 1,
};

/** Map the homeowner's studio finish picks onto the 3D scene palette. */
function paletteFrom(project: Project): ScenePalette {
  const f = project.finishes ?? {};
  return {
    floor: optionFor("floor", f.floor)?.color,
    wall: optionFor("walls", f.walls)?.color,
    feature: optionFor("tiles", f.tiles)?.color,
    wood: optionFor("vanity", f.vanity)?.color,
    metal: optionFor("fittings", f.fittings)?.color,
    ceramic: optionFor("wc", f.wc)?.color,
    light: optionFor("lighting", f.lighting)?.color,
  };
}

/**
 * The finished bathroom in real 3D — the classic 4D planner's WebGL renderer,
 * reused in the studio so the "3D View" shows a realistic room the homeowner can
 * actually picture, not a flat massing block.
 *
 * Leaner than the full 4D viewer: no build timeline, no play controls — it draws
 * the completed bathroom (progress = 1) and lets you orbit it. Three.js loads
 * lazily (dynamic import) so the rest of the planner never pays for it. On a
 * device without WebGL it falls back to the 2D floor plan.
 */

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** What a parent can do with the live scene — capture the framed view as a PNG. */
export interface RoomSceneApi {
  capture: (width: number, height: number) => string;
}

export function Room3DWebGL({
  project,
  bare = false,
  onReady,
}: {
  project: Project;
  bare?: boolean;
  /** Called with a capture handle when the scene is live, and `null` when it goes away. */
  onReady?: (api: RoomSceneApi | null) => void;
}) {
  const t = useT();
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BathroomScene | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [version, setVersion] = useState(0);

  // Keep the latest onReady without re-running the scene lifecycle when it changes.
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  });

  // The positioned plan the scene draws from — respect the user's canvas edits.
  const basePlan = project.plan ?? generateLayout(project.room, project.fixtures);
  const plan = project.placedFixtures ? { ...basePlan, fixtures: project.placedFixtures } : basePlan;

  // Scene lifecycle: created on mount, disposed on unmount.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let instance: BathroomScene | null = null;
    import("@/components/planner/plan3d/BathroomScene")
      .then(({ BathroomScene }) => {
        if (cancelled) return;
        instance = new BathroomScene(host, { reducedMotion: reduced });
        sceneRef.current = instance;
        setStatus("ready");
        setVersion((v) => v + 1);
        onReadyRef.current?.({ capture: (w, h) => instance!.capture(w, h) });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      onReadyRef.current?.(null);
      instance?.dispose();
      sceneRef.current = null;
    };
  }, [reduced]);

  // Feed the model, and always show the finished result.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setModel({
      room: project.room,
      plan,
      fixtures: project.fixtures,
      style: project.style.architecture,
      addOns: project.addOns,
      palette: bare ? undefined : paletteFrom(project),
    });
    scene.setProgress(FINISHED);
    // `plan` is derived from project each render; the ids below capture what
    // actually changes the model, so we don't rebuild the scene every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    version,
    project.room,
    project.fixtures,
    project.addOns,
    project.style.architecture,
    project.placedFixtures,
    project.plan,
    project.finishes,
    bare,
  ]);

  if (status === "error") {
    return (
      <div className="w-full" role="img" aria-label={t("3D view unavailable — showing the 2D plan")}>
        <FloorPlanSvg room={project.room} plan={plan} />
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "4 / 3" }}>
      <div
        ref={hostRef}
        className="h-full w-full"
        role="img"
        aria-label={t("3D view of your bathroom — drag to rotate, scroll to zoom")}
      />
      {status === "loading" && (
        <p
          className="absolute inset-0 flex items-center justify-center text-[13px] text-body-soft"
          role="status"
        >
          {t("Loading 3D…")}
        </p>
      )}
    </div>
  );
}
