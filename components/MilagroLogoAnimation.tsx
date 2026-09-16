"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/useT";
import { useResolvedTheme } from "@/lib/useTheme";
import BrandLockup, { WORDMARK, BRAND_SLATE, BRAND_BLUE, Wordmark } from "@/components/brand/BrandLockup";
import styles from "./MilagroLogoAnimation.module.css";

/**
 * "From blueprint to Milagro Universe" — the hero logo animation.
 *
 * NAME RENAMED, ARTWORK NOT. This file was BathCraftLogoAnimation, and the
 * rename was only a rename: the PNGs it loads out of /logo are still the
 * BathCraft mark — logo-full, wordmark-bath, wordmark-craft and the icon
 * layers. None of it is Milagro artwork yet. Swapping the assets is a separate
 * job; until it happens the navbar draws the old logo under the new name.
 *
 * The supplied logo is a flat raster, so nothing here draws the mark. Instead
 * `scripts/gen-logo-layers.js` slices the original PNG into four disjoint,
 * pixel-exact layers, and each layer is revealed through an animated SVG mask
 * whose stroke sweeps along that element's centreline. The pixels on screen are
 * always the supplied pixels; only their visibility is animated.
 *
 * The resting frame deliberately does not depend on those masks: at 2.6s an
 * unmasked copy of the complete icon fades in *underneath* the masked layers.
 * Anything a sweep path under-covers fills in, the already-drawn ink never
 * cross-fades (so there is no mid-transition lightening), and if masking fails
 * on some engine the worst case is a logo that appears without being drawn.
 *
 * Timings live in the CSS module; PLAY_MS below is the one number that has to
 * stay in step with it.
 */

/** Length of the full desktop sequence. Every variant scales it by CSS `--d`. */
const PLAY_MS = 4850;
const REDUCED_MS = 240;

type Phase = "idle" | "playing" | "done";

type Props = {
  /**
   * "navbar"  — small, ~2s, plays once on mount, then it is just the logo.
   * "inline"  — the compact lockup used beside copy.
   * "splash"  — an opening screen: larger, centred, slow enough to read.
   *
   * Only "splash" and "inline" carry the tagline and the replay control; the
   * navbar is a logo, not a demo.
   */
  variant?: "navbar" | "inline" | "splash";
};

export default function MilagroLogoAnimation({ variant = "inline" }: Props) {
  const t = useT();
  const isNavbar = variant === "navbar";

  /**
   * The lockup and the two wordmark halves are flat rasters with no alpha —
   * dark ink on an opaque white rectangle. Invisible on a white page, a white
   * box on a dark one. CSS cannot fix that, so the dark theme swaps in the
   * white-on-transparent artwork instead. The icon layers already carry alpha
   * and keep their brand colours in both themes.
   *
   * Geometry is identical between the two sets — see scripts/gen-logo-dark.mjs.
   */
  const dark = useResolvedTheme() === "dark";
  /**
   * The icon is drawn in slate #4a5c72 and brand blue #038fc2. On the dark
   * surface the slate measures 2.5:1 — under WCAG 1.4.11's 3:1 for graphical
   * objects — so the structural frame all but vanishes and only the blue
   * details survive. scripts/gen-logo-dark.mjs recolours each layer in HSL,
   * lifting lightness without touching hue, to ~7:1.
   */
  const icon = (name: string) => `/logo/${name}${dark ? "-dark" : ""}.png`;
  /** The wordmark is live text (see components/brand/BrandLockup), white on the dark theme. */
  const wordTone = dark ? "white" : "brand";
  const stageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [hasPlayed, setHasPlayed] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const play = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;

    // Restarting a CSS animation needs the class removed, a forced reflow, then
    // the class re-added. Re-keying the SVG instead would re-decode the images.
    el.classList.remove(styles.run);
    void el.offsetWidth;
    el.classList.add(styles.run);

    setPhase("playing");
    setHasPlayed(true);

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 1;
    const total = prefersReduced ? REDUCED_MS : PLAY_MS * speed;

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setPhase("done"), total + 120);
  }, []);

  // Autoplay once, when the mark is properly on screen. Scrolling back past it
  // must not restart it, so the observer disconnects on first fire.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      play();
      return;
    }

    // 60% of the container, per spec — but a viewport shorter than the stage
    // could never reach that ratio, which would leave the hero permanently
    // blank. Clamp to what is actually achievable here.
    const stageHeight = el.getBoundingClientRect().height;
    const threshold = stageHeight
      ? Math.min(0.6, (window.innerHeight * 0.9) / stageHeight)
      : 0.6;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        play();
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [play]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  return (
    <div
      className={[styles.wrap, variant === "splash" && styles.splash, isNavbar && styles.navbar]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Without JS the masks never open, so swap in the untouched lockup. */}
      <noscript>
        <style
          dangerouslySetInnerHTML={{
            __html: "[data-bc-anim]{display:none!important}",
          }}
        />
        <BrandLockup tone={wordTone} className="block h-auto w-full" />
      </noscript>

      <div
        data-bc-anim
        ref={stageRef}
        className={styles.stage}
        data-phase={phase}
        /* Hover only comes alive once the mark has settled. */
        data-hoverable={phase === "done" && !reduced ? "true" : "false"}
      >
        <svg
          className={styles.svg}
          viewBox="0 0 846 272"
          role="img"
          aria-label="Milagro Universe"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="bc-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M24 0H0v24" fill="none" stroke="#4a5c72" strokeWidth="1" />
            </pattern>

            <linearGradient id="bc-sheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7fd4f5" stopOpacity="0" />
              <stop offset="50%" stopColor="#9fe2ff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#7fd4f5" stopOpacity="0" />
            </linearGradient>

            {/* Reveal masks. Each path carries pathLength="1" so the dash
                animation is a plain 1 -> 0 regardless of real path length. */}
            <mask id="bc-mask-frame-slate" maskUnits="userSpaceOnUse">
              <g className={styles.maskInk} strokeWidth="18">
                <path
                  className={styles.frameSlate}
                  pathLength="1"
                  d="M20 7H246A13 13 0 0 1 259 20V252A13 13 0 0 1 246 265H20A13 13 0 0 1 7 252V20A13 13 0 0 1 20 7Z"
                />
              </g>
            </mask>

            <mask id="bc-mask-frame-blue" maskUnits="userSpaceOnUse">
              <g className={styles.maskInk} strokeWidth="18">
                <path
                  className={styles.frameBlue}
                  pathLength="1"
                  d="M52 36H274A15 15 0 0 1 289 51V220A15 15 0 0 1 274 235H52A15 15 0 0 1 37 220V51A15 15 0 0 1 52 36Z"
                />
              </g>
            </mask>

            <mask id="bc-mask-drop" maskUnits="userSpaceOnUse">
              <g className={styles.maskInk} strokeWidth="28">
                <path className={styles.diagA} pathLength="1" d="M88 0 172 135" />
                <path className={styles.diagB} pathLength="1" d="M2 146 128 272" />
                <path className={styles.barMid} pathLength="1" d="M46 184H94" />
                <path className={styles.barLow} pathLength="1" d="M12 235H92" />
                <path
                  className={styles.dropBowl}
                  pathLength="1"
                  d="M152 74C140 86 118 106 104 128C92 146 84 164 89 180C97 198 116 204 134 201C160 197 180 178 181 155"
                />
                <path
                  className={styles.dropCrescent}
                  pathLength="1"
                  strokeWidth="20"
                  d="M105 147C104 167 116 181 139 181"
                />
              </g>
            </mask>

            <mask id="bc-mask-faucet" maskUnits="userSpaceOnUse">
              <g className={styles.maskInk} strokeWidth="30">
                <path className={styles.diagBlue} pathLength="1" d="M180 2 128 86" />
                <path className={styles.pipeSupply} pathLength="1" d="M289 185H180" />
                <path className={styles.pipeRiser} pathLength="1" d="M230 226V100" />
                <path className={styles.pipeBarA} pathLength="1" d="M258 125H168A6 6 0 0 0 162 131V157" />
                <path className={styles.pipeBarB} pathLength="1" d="M240 143H196A6 6 0 0 0 190 149V157" />
                <path className={styles.pipeLegLink} pathLength="1" d="M162 152H194" />
                <path className={styles.pipeSpout} pathLength="1" d="M258 185V90A14 14 0 0 0 244 76H192" />
                <path className={styles.pipeSpoutInner} pathLength="1" d="M190 93C204 93 214 95 222 98" />
                <path
                  className={styles.faucetCrescent}
                  pathLength="1"
                  strokeWidth="20"
                  d="M108 150C107 167 119 178 134 178"
                />
                <path className={styles.pipeCorner} pathLength="1" d="M37 240V252A15 15 0 0 0 52 267" />
              </g>
            </mask>

            {/* Alpha mask of the two interior layers — confines the closing
                highlight to the faucet and water-drop, as specified. */}
            <mask id="bc-mask-ink" maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }}>
              <image href={icon("icon-faucet")} x="0" y="0" width="297" height="272" />
              <image href={icon("icon-drop")} x="0" y="0" width="297" height="272" />
            </mask>

            {/* Static alpha mask of the faucet alone — the hover highlight.
                Nothing animates inside it, unlike the reveal masks. */}
            <mask id="bc-mask-faucet-ink" maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }}>
              <image href={icon("icon-faucet")} x="0" y="0" width="297" height="272" />
            </mask>
          </defs>

          {/* Reduced-motion path: the finished lockup, faded in. Nothing draws. */}
          <g className={styles.reducedLogo}>
            <image href={icon("icon-icon")} x="0" y="0" width="297" height="272" />
            <Wordmark tone={wordTone} />
          </g>

          <g className={styles.motion}>
            <rect
              className={styles.grid}
              x="-120"
              y="-140"
              width="1100"
              height="560"
              fill="url(#bc-grid)"
              aria-hidden="true"
            />

            {/* Architect's construction guides — decorative, gone by 2.9s. */}
            <g className={styles.guides} aria-hidden="true">
              <g className={styles.guideLines}>
                <path className={styles.guideH1} pathLength="1" d="M-34 7H322" />
                <path className={styles.guideH2} pathLength="1" d="M-34 265H322" />
                <path className={styles.guideV1} pathLength="1" d="M7 -34V308" />
                <path className={styles.guideV2} pathLength="1" d="M289 -34V308" />
              </g>
              <g className={styles.guideDims}>
                <path d="M7 -26H289M7 -32v12M289 -32v12" />
                <path d="M-26 7V265M-32 7h12M-32 265h12" />
                <path className={styles.guideTicks} d="M77 -14v7M148 -18v11M218 -14v7" />
                <text className={styles.dimLabel} x="148" y="-36" textAnchor="middle">
                  8 ft
                </text>
                <text className={styles.dimLabel} x="-36" y="136" textAnchor="middle" transform="rotate(-90 -36 136)">
                  6 ft
                </text>
              </g>
            </g>

            {/* The mark. Order is bottom-up: the settled icon, then the drawn
                layers on top of it, then the highlight. */}
            <g className={styles.mark}>
              <image
                className={styles.settledIcon}
                href={icon("icon-icon")}
                x="0"
                y="0"
                width="297"
                height="272"
              />

              <image
                href={icon("icon-frame-slate")}
                x="0"
                y="0"
                width="297"
                height="272"
                mask="url(#bc-mask-frame-slate)"
              />

              {/* Blue layers ship as a slate-tinted twin plus the real thing, so
                  the blueprint-grey to brand-blue turn is a cross-fade rather
                  than a filter that could shift the brand colour. */}
              <g mask="url(#bc-mask-frame-blue)">
                <image className={styles.tint} href={icon("icon-frame-blue-slate")} x="0" y="0" width="297" height="272" />
                <image className={styles.colour} href={icon("icon-frame-blue")} x="0" y="0" width="297" height="272" />
              </g>
              <g mask="url(#bc-mask-faucet)">
                <image className={styles.tint} href={icon("icon-faucet-slate")} x="0" y="0" width="297" height="272" />
                <image className={styles.colour} href={icon("icon-faucet")} x="0" y="0" width="297" height="272" />
              </g>

              <image href={icon("icon-drop")} x="0" y="0" width="297" height="272" mask="url(#bc-mask-drop)" />

              <g className={styles.sheenClip} mask="url(#bc-mask-ink)" aria-hidden="true">
                <rect className={styles.sheen} x="-150" y="-20" width="120" height="320" fill="url(#bc-sheen)" />
              </g>
            </g>

            {/* Water moment. Drawn last so the droplet reads as in front. */}
            <g className={styles.water} aria-hidden="true">
              <g className={styles.dropletFall}>
                <ellipse className={styles.droplet} cx="176" cy="161" rx="4.6" ry="5.4" fill="#038fc2" />
              </g>
              <g className={styles.ripples}>
                <circle className={styles.rippleA} cx="176" cy="292" r="20" fill="none" stroke="#038fc2" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
                <circle className={styles.rippleB} cx="176" cy="292" r="30" fill="none" stroke="#038fc2" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
              </g>
            </g>

            {/* Hover microinteraction: its own droplet, its own tiny ripple. */}
            <g className={styles.hover} aria-hidden="true">
              <g mask="url(#bc-mask-faucet-ink)">
                <rect className={styles.hoverGlow} x="0" y="0" width="297" height="272" fill="#5cc6ea" />
              </g>
              <g className={styles.hoverFall}>
                <ellipse className={styles.hoverDroplet} cx="176" cy="161" rx="3.8" ry="4.6" fill="#038fc2" />
              </g>
              <circle
                className={styles.hoverRipple}
                cx="176"
                cy="172"
                r="11"
                fill="none"
                stroke="#038fc2"
                strokeWidth="1.8"
                vectorEffect="non-scaling-stroke"
              />
            </g>

            {/* Two coordinated lines — "Milagro" then "Universe" — never per-letter. */}
            <g
              className={styles.wordmark}
              fontSize={WORDMARK.fontSize}
              letterSpacing={WORDMARK.letterSpacing}
              style={WORDMARK.style}
            >
              <text className={styles.bath} x={WORDMARK.x} y={WORDMARK.line1.y} fill={dark ? "#fff" : BRAND_SLATE}>
                {WORDMARK.line1.text}
              </text>
              <text className={styles.craft} x={WORDMARK.x} y={WORDMARK.line2.y} fill={dark ? "#fff" : BRAND_BLUE}>
                {WORDMARK.line2.text}
              </text>
            </g>
          </g>
        </svg>

        {/* Two nowrap units so the narrow-screen break lands between the
            sentences, never inside "Without renovation regrets." */}
        {!isNavbar && (
          <p className={styles.tagline}>
            <span>{t("See it. Plan it. Build it.")}</span>{" "}
            <span>{t("Without renovation regrets.")}</span>
          </p>
        )}
      </div>

      {!isNavbar && (
        <button
          type="button"
          data-bc-anim
          className={styles.control}
          onClick={play}
          disabled={phase === "playing"}
        >
          <span aria-hidden="true" className={styles.controlIcon}>
            {hasPlayed ? "↻" : "▶"}
          </span>
          {hasPlayed ? "Replay animation" : "Watch it in motion"}
        </button>
      )}
    </div>
  );
}
