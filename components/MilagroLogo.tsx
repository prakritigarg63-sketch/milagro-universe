"use client";

import ReactDOM from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import {
  ICON_INK,
  ICON_PARTS,
  ICON_STROKE,
  LOCKUP,
  WORDMARK_BOX,
  WORDMARK_SCALE,
} from "@/lib/logo-icon";
import { GLYPHS } from "@/lib/logo-geometry";
import { useResolvedTheme } from "@/lib/useTheme";
import styles from "./MilagroLogo.module.css";

/**
 * The Milagro Universe lockup: icon, then wordmark.
 *
 * The wordmark is the supplied artwork, keyed off its screenshot background by
 * `scripts/gen-wordmark.mjs`. The icon is this repo's own geometry — see the
 * note at the top of `lib/logo-icon.ts` for why it exists and what it is not.
 *
 * Both are drawn, never faded: the icon's strokes are laid down first and the
 * letters follow, each revealed through a mask whose stroke sweeps down its
 * centreline. The dark variants are separate artwork rather than a CSS filter —
 * slate #4c596b measures 2.35:1 on the dark surface, under WCAG 1.4.11's 3:1
 * for graphical objects, and a filter fixing that drags the cyan's hue with it.
 *
 * `animate` is a property of the placement, not of the logo: the navbar
 * introduces the brand, the footer and the auth panel are showing it again.
 */

/** Must stay in step with the timings in the CSS module (icon step is 170ms). */
const GLYPH_START = 760;
const GLYPH_STEP = 58;
const GLYPH_STROKE = 520;
const PLAY_MS = Math.max(GLYPH_START + GLYPH_STEP * (GLYPHS.length - 1) + GLYPH_STROKE, 1500);

/** Lifted on the dark surface; see gen-wordmark.mjs for the contrast numbers. */
const DARK_INK = { slate: "#9cafc6", cyan: "#3fb3dd" } as const;

type Props = {
  /**
   * Which surface the mark sits on, and so which ink it needs. "auto" follows
   * the theme; "dark" is for the places that are dark whatever the theme says —
   * the auth panel sits on a darkened photograph in both.
   */
  surface?: "auto" | "light" | "dark";
  /** Draw the mark on, once, on first sight. */
  animate?: boolean;
  /** Sizing, height-first — the lockup is always `width: auto`. */
  className?: string;
  priority?: boolean;
};

export default function MilagroLogo({
  surface = "auto",
  animate = false,
  className = "h-12",
  priority = false,
}: Props) {
  const theme = useResolvedTheme();
  const resolved = surface === "auto" ? theme : surface;
  const dark = resolved === "dark";
  const src = dark ? "/logo/wordmark-dark.png" : "/logo/wordmark.png";
  const ink = dark ? DARK_INK : ICON_INK;

  /* The wordmark is a plain <image> inside the SVG rather than next/image, so
     that the gap and relative sizes are fixed by the viewBox instead of by CSS.
     Above the fold that costs a round trip the optimiser would have saved, so
     ask for it early instead. */
  if (priority) ReactDOM.preload(src, { as: "image" });

  return <Lockup src={src} ink={ink} animate={animate} className={className} />;
}

function Lockup({
  src,
  ink,
  animate,
  className,
}: {
  src: string;
  ink: typeof ICON_INK | typeof DARK_INK;
  animate: boolean;
  className: string;
}) {
  const stageRef = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<"idle" | "playing" | "done">(animate ? "idle" : "done");

  // Ids must be unique per instance, or a second lockup on the page would share
  // this one's mask.
  const uid = useId().replace(/:/g, "");
  const maskId = `mu-mark-${uid}`;

  useEffect(() => {
    if (!animate) return;
    const el = stageRef.current;
    if (!el) return;

    let done: number | undefined;
    let fallback: number | undefined;
    let played = false;

    const play = () => {
      if (played) return;
      played = true;
      window.clearTimeout(fallback);
      setPhase("playing");
      done = window.setTimeout(() => setPhase("done"), PLAY_MS + 160);
    };

    if (typeof IntersectionObserver === "undefined") {
      play();
      return () => window.clearTimeout(done);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        play();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);

    /* Waiting to be seen means the mark starts invisible, so "never seen" and
       "broken" look identical. If the observer has not fired while the page was
       actually on screen, play anyway.

       This used to jump to "done", which made the observer's failure mode
       indistinguishable from having no animation at all — and on a machine
       where the window is never painted, that is the only outcome anyone sees.
       Playing is the better failure: the mark still arrives, and it arrives the
       way it was designed to.

       Armed only while the page is visible: a background tab delivers no
       intersection records at all, which is the API working, not failing. */
    const arm = () => {
      if (played || document.visibilityState !== "visible") return;
      window.clearTimeout(fallback);
      fallback = window.setTimeout(() => {
        observer.disconnect();
        play();
      }, 1200);
    };
    arm();
    document.addEventListener("visibilitychange", arm);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", arm);
      window.clearTimeout(done);
      window.clearTimeout(fallback);
    };
  }, [animate]);

  return (
    <span className={`${styles.wrap} ${className}`}>
      {animate && (
        /* Without JS the phase never leaves "idle" and the lockup stays at zero
           opacity, so unhide it. */
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: "[data-mu-reveal]{opacity:1!important}" }} />
        </noscript>
      )}

      <span ref={stageRef} data-mu-reveal data-phase={phase} className={styles.stage}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${LOCKUP.width} ${LOCKUP.height}`}
          role="img"
          aria-label="Milagro Universe"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* One stroke per letter, down its centreline and as wide as the
                letter is, so sweeping the dash open traces that letter. */}
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={WORDMARK_BOX.width}
              height={WORDMARK_BOX.height}
            >
              {GLYPHS.map((g, i) => (
                <path
                  key={`${g.line}-${g.x}`}
                  className={styles.drawPath}
                  d={`M${g.x + g.w / 2} ${g.y}L${g.x + g.w / 2} ${g.y + g.h}`}
                  pathLength="1"
                  strokeWidth={g.w + 2}
                  style={{ "--i": i } as React.CSSProperties}
                />
              ))}
            </mask>
          </defs>

          <g className={styles.mark}>
            <g id="logo-icon" strokeWidth={ICON_STROKE}>
              {ICON_PARTS.map((p) => (
                <path
                  key={p.id}
                  className={styles.iconPath}
                  d={p.d}
                  stroke={ink[p.ink]}
                  pathLength="1"
                  style={{ "--i": p.order } as React.CSSProperties}
                />
              ))}
            </g>

            <g
              id="wordmark"
              transform={`translate(${LOCKUP.wordmarkX} 0) scale(${WORDMARK_SCALE})`}
            >
              {/* Underneath: the complete wordmark, fading in late so anything
                  the sweeps under-cover fills in without the drawn ink
                  cross-fading. */}
              <image
                className={styles.settled}
                href={src}
                width={WORDMARK_BOX.width}
                height={WORDMARK_BOX.height}
              />
              <image
                href={src}
                width={WORDMARK_BOX.width}
                height={WORDMARK_BOX.height}
                mask={`url(#${maskId})`}
              />
            </g>
          </g>
        </svg>
      </span>
    </span>
  );
}
