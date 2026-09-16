import type { SVGProps } from "react";

/**
 * One line-icon set for the whole page, so stroke weight and corner treatment
 * stay consistent. All icons are 24x24, 1.6 stroke, round caps — they inherit
 * `currentColor`, never carry their own fill.
 */
export type IconName =
  | "home"
  | "calculator"
  | "cart"
  | "shield"
  | "people"
  | "star"
  | "piggy"
  | "tile"
  | "pipe"
  | "valve"
  | "bag"
  | "toilet"
  | "sink"
  | "shower"
  | "cabinet"
  | "bathtub"
  | "search"
  | "play"
  | "arrowRight"
  | "arrowDown"
  | "swap"
  | "undo"
  | "redo"
  | "menu"
  | "close"
  | "instagram"
  | "youtube"
  | "linkedin"
  | "eye"
  | "eyeOff"
  | "warning"
  | "check"
  | "chevronDown"
  | "plus"
  | "user"
  | "logout"
  | "bookmark"
  | "settings"
  | "layers"
  | "hammer"
  | "building"
  | "lightbulb"
  | "wallet"
  | "ruler"
  | "sparkle"
  | "sun"
  | "moon";

const PATHS: Record<IconName, React.ReactNode> = {
  home: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />,
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v2M8 19h4" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2l2.2 10.4a1 1 0 0 0 1 .8h8.2a1 1 0 0 0 1-.78L19 8H6" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="16.5" cy="19" r="1.4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" />
      <path d="m9.2 12 2 2 3.6-3.8" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6S14 16 14.5 19" />
      <path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 14.7c2 .6 3.2 2.1 3.6 4.3" />
    </>
  ),
  star: <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 9.7l5.4-.8z" />,
  piggy: (
    <>
      <path d="M4 12.5c0-3 2.9-5 6.5-5H14c3 0 5.5 2 5.5 4.7 0 1.4-.6 2.6-1.6 3.5V19h-3v-1.6h-3.6V19h-3v-2.2c-1.4-.9-2.3-2-2.4-3.3H4z" />
      <path d="M15.5 11.2h.01M10.5 7.4c-.4-1.4.3-2.6 1.6-3" />
    </>
  ),
  tile: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </>
  ),
  pipe: <path d="M4 8h6a3 3 0 0 1 3 3v2a3 3 0 0 0 3 3h4M4 5v6M20 13v6" />,
  valve: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 4v4.8M12 15.2V20M4 12h4.8M15.2 12H20" />
    </>
  ),
  bag: (
    <>
      <path d="M6 8h12l1.4 11a1 1 0 0 1-1 1.1H5.6a1 1 0 0 1-1-1.1z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  toilet: (
    <>
      <path d="M7 4h3v5H7zM5.5 9h11l-1.4 6.2a3 3 0 0 1-2.9 2.3h-2.4a3 3 0 0 1-2.9-2.3z" />
      <path d="M9 17.5V20h6" />
    </>
  ),
  sink: (
    <>
      <path d="M4 12h16v1.5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
      <path d="M12 12V8a3 3 0 0 1 3-3h1" />
    </>
  ),
  shower: (
    <>
      <path d="M6 20V8a3 3 0 0 1 3-3h1" />
      <path d="M10.5 8.5h7.5l-1.2 3.5h-5.1z" />
      <path d="M12 16v1.5M15 15v2M18 16v1.5" />
    </>
  ),
  cabinet: (
    <>
      <rect x="4.5" y="4" width="15" height="16" rx="1.5" />
      <path d="M12 4v16M9.5 11h.5M14 11h.5" />
    </>
  ),
  bathtub: (
    <>
      <path d="M3 12h18v2.5a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
      <path d="M6 12V6.5a2 2 0 0 1 2-2h.5a2 2 0 0 1 2 2M6.5 18.5V20M17.5 18.5V20" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m15.5 15.5 4 4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5c1.2-3.3 3.9-5 7-5s5.8 1.7 7 5" />
    </>
  ),
  play: <path d="M9 6.5 17.5 12 9 17.5z" />,
  arrowRight: <path d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5" />,
  arrowDown: <path d="M12 4.5v14M6.5 13l5.5 5.5L17.5 13" />,
  swap: <path d="M9.5 8.5 6 12l3.5 3.5M14.5 8.5 18 12l-3.5 3.5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.4" />
      <path d="M16.8 7.3h.01" />
    </>
  ),
  youtube: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3.5" />
      <path d="m10.5 9.5 4.5 2.5-4.5 2.5z" />
    </>
  ),
  linkedin: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 10.5V16M8 7.6h.01M11.6 16v-3.2a1.9 1.9 0 0 1 3.8 0V16" />
    </>
  ),
  eye: (
    <>
      <path d="M2.2 12S5.5 5.8 12 5.8 21.8 12 21.8 12 18.5 18.2 12 18.2 2.2 12 2.2 12Z" />
      <circle cx="12" cy="12" r="3.1" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M9.6 6.2A8.6 8.6 0 0 1 12 5.8c6.5 0 9.8 6.2 9.8 6.2a17 17 0 0 1-3.2 4M6.4 7.9A16.8 16.8 0 0 0 2.2 12S5.5 18.2 12 18.2a9 9 0 0 0 4-.9" />
      <path d="M10 10a2.8 2.8 0 0 0 4 4M4 4l16 16" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4.4 21 19.6H3z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  check: <path d="m5 12.6 4.6 4.6L19 7.2" />,
  chevronDown: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  logout: <path d="M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2M10 12h10M17 9l3 3-3 3" />,
  bookmark: <path d="M6.5 4h11a1 1 0 0 1 1 1v15l-6.5-4-6.5 4V5a1 1 0 0 1 1-1Z" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M18 6l-1.4 1.4M7.4 16.6 6 18M18 18l-1.4-1.4M7.4 7.4 6 6" />
    </>
  ),
  layers: <path d="m12 4 8 4.2-8 4.2-8-4.2zM4 13.2 12 17.4l8-4.2M4 17.6 12 21.8l8-4.2" />,
  hammer: <path d="M14 6.5 17.5 3 21 6.5 17.5 10zM15.8 8.2 6.4 17.6a2 2 0 0 0 0 2.8 2 2 0 0 0 2.8 0l9.4-9.4M9 6 6 9M7.5 4.5 4.5 7.5" />,
  building: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M10 20v-4h4v4" />
    </>
  ),
  lightbulb: <path d="M9 17.5h6M10 20.5h4M12 3.5a5.5 5.5 0 0 0-3.2 9.96c.5.37.8.94.8 1.54h4.8c0-.6.3-1.17.8-1.54A5.5 5.5 0 0 0 12 3.5Z" />,
  wallet: (
    <>
      <rect x="3.5" y="6" width="17" height="13" rx="2.5" />
      <path d="M3.5 10h17M16.5 14.5h.01" />
    </>
  ),
  ruler: (
    <>
      <rect x="2.5" y="8.5" width="19" height="7" rx="1.5" />
      <path d="M6.5 8.5v3M10 8.5v4.5M13.5 8.5v3M17 8.5v4.5" />
    </>
  ),
  sparkle: <path d="m12 4 1.9 4.6L18.5 10.5l-4.6 1.9L12 17l-1.9-4.6L5.5 10.5l4.6-1.9z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20 13.5A8 8 0 0 1 10.5 4a8 8 0 1 0 9.5 9.5Z" />,
  /* Undo/redo double back on themselves. "swap" was used for both, but it is
     horizontally symmetric, so mirroring it for undo produced the same glyph
     twice and neither read as undo. */
  undo: <path d="M4 9h10a5 5 0 0 1 0 10h-6M4 9l4-4M4 9l4 4" />,
  redo: <path d="M20 9H10a5 5 0 0 0 0 10h6M20 9l-4-4M20 9l-4 4" />,
};

const FILLED: IconName[] = ["star", "play", "home", "sparkle"];

export default function Icon({
  name,
  size = 24,
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  const filled = FILLED.includes(name);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
