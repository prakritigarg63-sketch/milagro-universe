import type { Metadata } from "next";
import { Caveat, Hanken_Grotesk, Marcellus, Noto_Sans_Devanagari } from "next/font/google";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { LOCALE_SCRIPT } from "@/lib/i18n/locale";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

/**
 * Hanken Grotesk: one calm, slightly warm grotesk for the whole product —
 * landing, sign-in, planner and the Milagro Universe wordmark. Tabular figures
 * keep prices and dimensions aligned.
 */
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

/**
 * Marcellus: headlines only (page and section titles). Roman inscriptional
 * letterforms — stone and architecture — against Hanken Grotesk for everything
 * people read and operate. The wordmark stays in Hanken.
 */
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marcellus",
  display: "swap",
});

/**
 * Devanagari. Hanken Grotesk covers no Devanagari at all, so Hindi would otherwise fall
 * back to whatever the OS happens to have — different metrics, different
 * weight, visibly not the same typeface. Listed after Hanken Grotesk in the stack so
 * Latin text inside Hindi copy (Milagro Universe, Google, KOHLER) still sets in Hanken Grotesk.
 */
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Handwritten marginalia only — see components/ui/Annotation.tsx. */
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Milagro Universe — From ideas to beautiful bathrooms",
  description:
    "Plan, visualize, estimate and build your bathroom in one place. Measurements to layouts, styles, material lists and costed plans.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${marcellus.variable} ${caveat.variable} ${devanagari.variable}`}
      suppressHydrationWarning
      /* globals.css sets scroll-behavior: smooth for in-page anchors. Without
         this marker Next also applies it to route changes, so a new screen
         scrolls up instead of starting at the top. */
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Sets data-theme before first paint. Anything later — a component, an
            effect, even a blocking <script src> — lands after the browser has
            already painted, which reads as a white flash on a dark page. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* Sets lang="hi" before paint, so the Devanagari stack applies on the
            first frame and screen readers announce the right language. */}
        <script dangerouslySetInnerHTML={{ __html: LOCALE_SCRIPT }} />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <AnalyticsProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
