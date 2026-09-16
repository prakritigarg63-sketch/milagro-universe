/**
 * The static Milagro Universe lockup: the supplied icon raster beside a live
 * two-line wordmark ("Milagro" in slate over "Universe" in brand blue).
 *
 * The old lockup artwork spelled a different name, so the wordmark is set in
 * text rather than cropped from a raster. The canvas keeps the old 846×272 box,
 * so every place that sized the previous lockup lays out exactly as before.
 */

export const LOCKUP_W = 846;
export const LOCKUP_H = 272;

/** Shared with MilagroLogoAnimation so the animated and static marks match. */
export const WORDMARK = {
  x: 335,
  fontSize: 118,
  letterSpacing: -2.4,
  line1: { text: "Milagro", y: 116 },
  line2: { text: "Universe", y: 240 },
  style: { fontFamily: "var(--font-hanken), system-ui, sans-serif", fontWeight: 600 },
} as const;

export const BRAND_SLATE = "#4a5c72";
export const BRAND_BLUE = "#038fc2";

type Props = {
  /**
   * "brand" — colour icon + slate/blue words, for light surfaces.
   * "dark"  — the lifted dark-theme icon + white words, for dark app surfaces.
   * "white" — all white, for photography.
   */
  tone?: "brand" | "dark" | "white";
  className?: string;
};

export function Wordmark({ tone = "brand" }: { tone?: "brand" | "white" }) {
  const white = tone === "white";
  return (
    <text fontSize={WORDMARK.fontSize} letterSpacing={WORDMARK.letterSpacing} style={WORDMARK.style}>
      <tspan x={WORDMARK.x} y={WORDMARK.line1.y} fill={white ? "#fff" : BRAND_SLATE}>
        {WORDMARK.line1.text}
      </tspan>
      <tspan x={WORDMARK.x} y={WORDMARK.line2.y} fill={white ? "#fff" : BRAND_BLUE}>
        {WORDMARK.line2.text}
      </tspan>
    </text>
  );
}

export default function BrandLockup({ tone = "brand", className }: Props) {
  return (
    <svg
      viewBox={`0 0 ${LOCKUP_W} ${LOCKUP_H}`}
      role="img"
      aria-label="Milagro Universe"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {tone === "white" ? (
        // No white icon-only asset exists; the white lockup's first 297px is the icon.
        <svg x="0" y="0" width="297" height="272" viewBox="0 0 297 272">
          <image href="/logo/logo-white.png" x="0" y="0" width={LOCKUP_W} height={LOCKUP_H} />
        </svg>
      ) : (
        <image
          href={tone === "dark" ? "/logo/icon-icon-dark.png" : "/logo/icon-icon.png"}
          x="0"
          y="0"
          width="297"
          height="272"
        />
      )}
      <Wordmark tone={tone === "brand" ? "brand" : "white"} />
    </svg>
  );
}
