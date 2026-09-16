"use client";

import { useEffect, useId, useRef } from "react";
import styles from "./MilagroIconAnimation.module.css";

/**
 * "From blueprint to life" — the icon-only brand animation (~15s).
 *
 * EMPTY → BLUEPRINT → STRUCTURE → CONNECTION → WATER → ORIGINAL ICON.
 *
 * Same principle as MilagroLogoAnimation: nothing here redraws the mark. The
 * ink is the four pixel-exact slices of the supplied icon (see
 * docs/logo-geometry.md), each revealed through an SVG mask whose stroke sweeps
 * along that element's centreline. The pale-blue blueprint underneath is the
 * only vector drawing, and it is gone before the icon settles.
 *
 * The resting frame never depends on the masks: the untouched icon raster fades
 * in underneath the drawn ink as the mark locks into place, so the final frame
 * is the supplied icon on white.
 *
 * All timing lives in the CSS module; PLAY_MS is the one number that has to
 * stay in step with it.
 */

/** Full sequence, including the closing hold. Scaled by the CSS `--d` knob. */
export const PLAY_MS = 15000;

/** Icon canvas, in source pixels. */
const W = 297;
const H = 272;

type Props = {
  /** Called once the closing hold has finished. */
  onDone?: () => void;
  className?: string;
};

export default function MilagroIconAnimation({ onDone, className }: Props) {
  // Mask ids must be unique per instance and safe inside url(#…).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `mi-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  const stageRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // Plays once on mount. To replay, re-key the component.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 1;
    // Start on the next frame so the first paint is the empty canvas, not a
    // half-applied animation.
    const raf = requestAnimationFrame(() => el.classList.add(styles.run));
    const timer = window.setTimeout(
      () => onDoneRef.current?.(),
      reduced ? 300 : PLAY_MS * speed,
    );
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, []);

  const layer = (name: string, mask?: string) => (
    <image
      href={`/logo/icon-${name}.png`}
      x="0"
      y="0"
      width={W}
      height={H}
      mask={mask ? url(mask) : undefined}
    />
  );

  return (
    <div ref={stageRef} className={[styles.stage, className].filter(Boolean).join(" ")}>
      {/* Canvas is symmetric around the icon's centre (148.5, 136), so the icon
          sits dead centre and the ripple below has room without shifting it. */}
      <svg
        className={styles.svg}
        viewBox="-70 -84 437 440"
        role="img"
        aria-label="Milagro Universe icon"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Reveal masks — centreline sweeps, pathLength="1" so every draw is 1 → 0. */}
          <mask id={id("m-frame-slate")} maskUnits="userSpaceOnUse">
            <g className={styles.maskInk} strokeWidth="18">
              <path
                className={styles.inkFrameSlate}
                pathLength="1"
                d="M20 7H246A13 13 0 0 1 259 20V252A13 13 0 0 1 246 265H20A13 13 0 0 1 7 252V20A13 13 0 0 1 20 7Z"
              />
            </g>
          </mask>

          <mask id={id("m-frame-blue")} maskUnits="userSpaceOnUse">
            <g className={styles.maskInk} strokeWidth="18">
              <path
                className={styles.inkFrameBlue}
                pathLength="1"
                d="M52 36H274A15 15 0 0 1 289 51V220A15 15 0 0 1 274 235H52A15 15 0 0 1 37 220V51A15 15 0 0 1 52 36Z"
              />
            </g>
          </mask>

          <mask id={id("m-drop")} maskUnits="userSpaceOnUse">
            <g className={styles.maskInk} strokeWidth="28">
              <path className={styles.inkDiagA} pathLength="1" d="M88 0 172 135" />
              <path className={styles.inkDiagB} pathLength="1" d="M2 146 128 272" />
              <path
                className={styles.inkDropBowl}
                pathLength="1"
                d="M152 74C140 86 118 106 104 128C92 146 84 164 89 180C97 198 116 204 134 201C160 197 180 178 181 155"
              />
              <path
                className={styles.inkDropCrescent}
                pathLength="1"
                strokeWidth="20"
                d="M105 147C104 167 116 181 139 181"
              />
              <path className={styles.inkBarMid} pathLength="1" d="M46 184H94" />
              <path className={styles.inkBarLow} pathLength="1" d="M12 235H92" />
            </g>
          </mask>

          <mask id={id("m-faucet")} maskUnits="userSpaceOnUse">
            <g className={styles.maskInk} strokeWidth="30">
              <path className={styles.inkDiagBlue} pathLength="1" d="M180 2 128 86" />
              <path
                className={styles.inkFaucetCrescent}
                pathLength="1"
                strokeWidth="20"
                d="M108 150C107 167 119 178 134 178"
              />
              <path className={styles.inkSpout} pathLength="1" d="M192 76H244A14 14 0 0 1 258 90V185" />
              <path className={styles.inkSpoutInner} pathLength="1" d="M190 93C204 93 214 95 222 98" />
              <path className={styles.inkRiser} pathLength="1" d="M230 100V226" />
              <path className={styles.inkBarA} pathLength="1" d="M258 125H168A6 6 0 0 0 162 131V157" />
              <path className={styles.inkBarB} pathLength="1" d="M240 143H196A6 6 0 0 0 190 149V157" />
              <path className={styles.inkLegLink} pathLength="1" d="M162 152H194" />
              <path className={styles.inkSupply} pathLength="1" d="M180 185H289" />
              <path className={styles.inkCorner} pathLength="1" d="M37 240V252A15 15 0 0 0 52 267" />
            </g>
          </mask>

          {/* Blueprint reveal masks — same centrelines as the ink, own timing. */}
          <mask id={id("bp-frame-slate")} maskUnits="userSpaceOnUse">
            <g className={styles.maskInk} strokeWidth="18">
              <path
                className={styles.bpFrameSlate}
                pathLength="1"
                d="M20 7H246A13 13 0 0 1 259 20V252A13 13 0 0 1 246 265H20A13 13 0 0 1 7 252V20A13 13 0 0 1 20 7Z"
              />
            </g>
          </mask>
          <mask id={id("bp-frame-blue")} maskUnits="userSpaceOnUse">
            <g className={styles.maskInk} strokeWidth="18">
              <path
                className={styles.bpFrameBlue}
                pathLength="1"
                d="M52 36H274A15 15 0 0 1 289 51V220A15 15 0 0 1 274 235H52A15 15 0 0 1 37 220V51A15 15 0 0 1 52 36Z"
              />
            </g>
          </mask>
          <mask id={id("bp-drop")} maskUnits="userSpaceOnUse">
            <g className={styles.maskInk} strokeWidth="28">
              <path className={styles.bpDiagA} pathLength="1" d="M88 0 172 135" />
              <path className={styles.bpDiagB} pathLength="1" d="M2 146 128 272" />
              <path
                className={styles.bpDropBowl}
                pathLength="1"
                d="M152 74C140 86 118 106 104 128C92 146 84 164 89 180C97 198 116 204 134 201C160 197 180 178 181 155"
              />
              <path className={styles.bpDropCrescent} pathLength="1" strokeWidth="20" d="M105 147C104 167 116 181 139 181" />
              <path className={styles.bpBarMid} pathLength="1" d="M46 184H94" />
              <path className={styles.bpBarLow} pathLength="1" d="M12 235H92" />
            </g>
          </mask>
          <mask id={id("bp-faucet")} maskUnits="userSpaceOnUse">
            <g className={styles.maskInk} strokeWidth="30">
              <path className={styles.bpDiagBlue} pathLength="1" d="M180 2 128 86" />
              <path className={styles.bpFaucetCrescent} pathLength="1" strokeWidth="20" d="M108 150C107 167 119 178 134 178" />
              <path className={styles.bpSpout} pathLength="1" d="M192 76H244A14 14 0 0 1 258 90V185" />
              <path className={styles.bpSpoutInner} pathLength="1" d="M190 93C204 93 214 95 222 98" />
              <path className={styles.bpRiser} pathLength="1" d="M230 100V226" />
              <path className={styles.bpBarA} pathLength="1" d="M258 125H168A6 6 0 0 0 162 131V157" />
              <path className={styles.bpBarB} pathLength="1" d="M240 143H196A6 6 0 0 0 190 149V157" />
              <path className={styles.bpLegLink} pathLength="1" d="M162 152H194" />
              <path className={styles.bpSupply} pathLength="1" d="M180 185H289" />
              <path className={styles.bpCorner} pathLength="1" d="M37 240V252A15 15 0 0 0 52 267" />
            </g>
          </mask>

          <linearGradient id={id("droplet")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#038fc2" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#038fc2" />
          </linearGradient>
        </defs>

        {/* Reduced motion: the finished icon, faded in. Nothing draws. */}
        <image className={styles.reducedIcon} href="/logo/icon-icon.png" x="0" y="0" width={W} height={H} />

        <g className={styles.motion}>
          <g className={styles.mark}>
            {/* SHOT 1 — guide marks. Registration crosses, extension lines,
                faint dimension ticks. Deliberately no numbers, no text. */}
            <g className={styles.guides} aria-hidden="true">
              <g className={styles.registration}>
                <path d="M148.5 128v16M140.5 136h16" />
                <path d="M-26 -1v16M-34 7h16" />
                <path d="M323 227v16M315 235h16" />
              </g>
              <g className={styles.corners}>
                <path d="M7 -30v22M-30 7h22" />
                <path d="M289 -30v22M297 36h22" />
                <path d="M7 302v-22M-30 265h22" />
                <path d="M289 302v-22M297 235h22" />
              </g>
              <g className={styles.extensions}>
                <path className={styles.extTop} pathLength="1" d="M-44 7H330" />
                <path className={styles.extBottom} pathLength="1" d="M-44 265H330" />
                <path className={styles.extLeft} pathLength="1" d="M7 -48V316" />
                <path className={styles.extRight} pathLength="1" d="M289 -48V316" />
                <path className={styles.extBlueTop} pathLength="1" d="M-44 36H330" />
                <path className={styles.extBlueLeft} pathLength="1" d="M37 -48V316" />
              </g>
              <g className={styles.dims}>
                <path d="M7 -40H289M7 -45v10M289 -45v10" />
                <path d="M77 -40v-4M148 -40v-6M218 -40v-4" />
                <path d="M-40 7V265M-45 7h10M-45 265h10" />
                <path d="M-40 71h-4M-40 136h-6M-40 200h-4" />
                <path className={styles.diagGuide} d="M58 -48 206 190" />
              </g>
            </g>

            {/* SHOT 2 — the blueprint. Not a redrawing: the pale lines are the
                traced edges of the supplied icon's own strokes, pre-rendered by
                scripts/gen-logo-blueprint.mjs, revealed along the same centrelines
                the ink uses — so the plan lands exactly where the logo will. */}
            <g className={styles.blueprint} aria-hidden="true">
              <g mask={url("bp-frame-slate")}>
                <image href="/logo/blueprint-frame-slate.png" x="0" y="0" width={W} height={H} />
              </g>
              <g mask={url("bp-frame-blue")}>
                <image href="/logo/blueprint-frame-blue.png" x="0" y="0" width={W} height={H} />
              </g>
              <g mask={url("bp-drop")}>
                <image href="/logo/blueprint-drop.png" x="0" y="0" width={W} height={H} />
              </g>
              <g mask={url("bp-faucet")}>
                <image href="/logo/blueprint-faucet.png" x="0" y="0" width={W} height={H} />
              </g>
            </g>

            {/* SHOTS 3–5 — the supplied pixels. The settled icon sits underneath
                and fades in as the drawing locks, so the last frame is the
                original raster rather than the union of the sweeps. */}
            <image className={styles.settledIcon} href="/logo/icon-icon.png" x="0" y="0" width={W} height={H} />
            <g className={styles.ink}>
              <g className={styles.inkStructure}>{layer("frame-slate", "m-frame-slate")}</g>
              <g className={styles.inkFrame}>{layer("frame-blue", "m-frame-blue")}</g>
              {layer("drop", "m-drop")}
              {layer("faucet", "m-faucet")}
            </g>
          </g>

          {/* SHOT 6 — one drop, one ripple. Outside .mark so the settle scale
              never nudges it. */}
          <g className={styles.water} aria-hidden="true">
            <g className={styles.dropletFall}>
              <g className={styles.dropletForm}>
                <path
                  d="M176 155.5C178.4 159 181 162 181 165.2A5 5 0 0 1 171 165.2C171 162 173.6 159 176 155.5Z"
                  fill={url("droplet")}
                />
                <ellipse cx="174.2" cy="164.4" rx="1.1" ry="1.7" fill="#fff" fillOpacity="0.55" />
              </g>
            </g>
            <ellipse className={styles.rippleA} cx="176" cy="306" rx="46" ry="8" />
            <ellipse className={styles.rippleB} cx="176" cy="306" rx="70" ry="12" />
          </g>
        </g>
      </svg>
    </div>
  );
}
