# Milagro Universe

Landing page for Milagro Universe, a bathroom planning and renovation platform, built
to match a supplied design reference.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
npm run check:db   # verify the Supabase connection
npm run check:i18n # report any untranslated string
```

Next.js 16 (App Router) · React 19 · Tailwind v4 · Inter + Caveat. No animation
library — motion is CSS plus a couple of IntersectionObservers.

## Read this before publishing

Three things in here are **prototype-grade and must not ship as-is**:

1. **Metrics and testimonials are invented.** "10,000+ happy homeowners",
   "4.8/5", "30% average cost savings", "50+ trusted brands" and all three
   customer quotes are placeholders with no basis. They are isolated at the top
   of [`lib/content.ts`](lib/content.ts) behind a warning comment. Substantiate
   or delete them.
2. **The photography is licensed stock, not Milagro Universe's work** — including the
   testimonial thumbnails, which are not the homes of the people quoted. See
   [`public/photos/CREDITS.md`](public/photos/CREDITS.md).
3. **Brand names are set in type, not logos.** Jaquar, CERA, Hindware, KOHLER
   and GROHE are real companies; drawing an approximation of a trademark would
   misrepresent them. Swap in licensed logo files once you have permission.

## Structure

```
app/
  layout.tsx            fonts, metadata
  page.tsx              section composition only
  globals.css           design tokens + shared keyframes
lib/content.ts          every repeated string and list
components/ui/          Button, Icon, SectionHeading, Reveal, Annotation
components/site/        one file per section
components/MilagroLogoAnimation.tsx   the logo, three variants
scripts/gen-logo-layers.js              slices the logo raster
docs/logo-geometry.md                   measurements behind that slicing
```

Sections, in page order: `Navbar` · `Hero` · `ValuePropositionBar` ·
`BathroomPlanningSection` (wraps `BeforeAfterSlider`) · `HowItWorks` ·
`PlannerDemo` · `StyleExplorer` · `BrandComparison` · `TileVisualizer` ·
`MetricsBar` · `Testimonials` · `FinalCTA` · `Footer`.

## Design system

| Token | Value | Role |
| --- | --- | --- |
| `ink` | `#102B4E` | headings, nav |
| `body` | `#42566F` | running copy |
| `brand` | `#078CC8` | primary actions, eyebrows, active state |
| `wash` | `#F3FAFE` | sections that sit back from white |

Cards 14px, buttons fully pill, two shadow steps (`--shadow-soft`,
`--shadow-lift`). Warmth lives only inside the photographs.

### English and Hindi

A toggle in the navbar, next to the theme switch. The whole interface
translates — navigation, hero, every section, auth, onboarding, the dashboard
and the error states.

```
lib/i18n/dictionary.ts   Hindi, keyed by the English source string
lib/i18n/locale.ts       the store, plus LOCALE_SCRIPT
lib/i18n/useT.ts         useT() and useLocale()
components/ui/LanguageToggle.tsx
```

**Keyed by the English, not by invented ids.** `t("Sign in")` rather than
`t("auth.signIn")`: there is nothing to keep in sync, and an untranslated
string falls back to correct English instead of showing a raw key to a user.
`npm run check:i18n` reports any `t()` literal with no entry, because a silent
fallback is otherwise invisible until someone switches language.

**Devanagari is a real font, not a fallback.** Inter contains no Devanagari at
all, so Hindi would otherwise render in whatever the OS supplies. Noto Sans
Devanagari is loaded and sits *after* Inter in the stack, so Latin inside Hindi
copy — Milagro Universe, Google, KOHLER — still sets in Inter.

Not translated, deliberately: the Milagro Universe name, the brand names, numerals and
units in the prototype figures, and the testimonial customer names.

**TRADEOFF.** The locale lives in `localStorage`, not a cookie or a `/hi/` URL
segment. That keeps the marketing pages static, but the server renders English
and Hindi arrives after hydration, and search engines only ever see the English.
Proper locale routing (next-intl with a `[locale]` segment) fixes both and is
the right move if Hindi SEO matters. It is a much larger change than a toggle.

One consequence worth knowing: any component that renders translated text has
to be a client component, so nine presentational sections gained `"use client"`.

### Light and dark

Every colour in the table above is a CSS custom property, and the theme switch
redefines those properties rather than adding a second set of classes. Nothing
in a component says "dark".

```
app/globals.css       @theme = light values; dark overrides below it
lib/theme.ts          the store, plus THEME_SCRIPT
components/ui/ThemeToggle.tsx   the sun/moon button in the navbar
```

Three states, not two. **system** is the default and follows the OS; **light**
and **dark** are explicit and stored in `localStorage` under
`milagro.theme`. Dark is applied twice on purpose — once behind
`@media (prefers-color-scheme: dark)` for the system default, once behind
`[data-theme="dark"]` so an explicit choice outranks the OS.

Three things are easy to get wrong here and are handled:

- **The flash.** `THEME_SCRIPT` is inlined into `<head>` and sets the
  attribute before first paint. A component or an effect runs after the browser
  has already painted, which reads as a white flash on a dark page.
- **Hydration.** The toggle reads the resolved theme through
  `useSyncExternalStore`, so the hydration render uses the server value and the
  browser value lands on the pass after. Calling `matchMedia` during render is
  what produces a mismatch.
- **`color-scheme`.** Set alongside the tokens so scrollbars and native form
  chrome follow the theme. Without it you get a white scrollbar on a dark page.

Two escapes from the theme, both deliberate:

| Escape | Where | Why |
| --- | --- | --- |
| `.on-light` | hero's white button, planner toolbar and hint, before/after slider | These sit on a **photograph**, and a photograph does not get darker when the theme does. The class re-declares the light tokens for that subtree, so the utilities inside are unchanged. |
| `--color-on-brand` | any text on `bg-brand` | Light and dark pull in opposite directions: white on `#078CC8` is 4.7:1, but dark mode lifts brand to `#3FA9DD` so it is legible *as text*, and white on that is only 2.6:1. The paired foreground flips with the theme. |

Whites that stay white in both themes: text over the hero and auth photographs,
the blueprint and planner "paper", and the Google `G`.

## The things that actually do something

Not a screenshot — these were each exercised and verified in a browser:

- **Sticky navbar** gains a hairline, shadow and backdrop blur past 8px of scroll.
- **Watch Video** opens a real dialog: focus moves in, Tab is trapped, Escape
  and backdrop click close it, scroll is locked, focus returns to the trigger.
  The frame holds a labelled placeholder — there is no film yet.
- **Before/after slider** drags by pointer and by ←/→/Home/End, with
  `role="slider"` and live `aria-valuetext`. Both halves are the *same* room:
  the blueprint is hand-drawn SVG of the photograph's own layout.
- **Planner** — the selected fixture is draggable and arrow-key movable, and the
  toolbar changes what is selected.
- **Style coverflow** — the selected card sits centred and full size, its
  neighbours smaller and dimmed. The track is anchored at `left-1/2` and
  translated back by the distance to the middle of the active card, so it
  centres at every breakpoint without measuring anything in JS; `--card` and
  `--gap` are the only numbers. Click a card or a pill, or use ←/→/Home/End.
  Only transform and opacity animate. No autoplay, deliberately.
- **Tile swatches** fan on hover and are individually selectable.
- **Mobile nav** toggles `aria-expanded`, goes `inert` when closed, locks scroll.
- **Scroll reveal** via one shared `Reveal` component, staggered per section.

## Logo

`components/MilagroLogoAnimation.tsx`, three variants:

| Variant | Where | Length |
| --- | --- | --- |
| `navbar` | header | ~8.1s, plays once, then it is just the logo |
| `inline` | beside copy | 4.85s desktop / 3.0s mobile |
| `splash` | full-screen opener | 8.5s desktop / 5.3s mobile |

Pace is one number — `--d` on `.stage` — and `PLAY_MS` reads it back off the
element so the JS timer cannot drift from the CSS.

### The rasters have no alpha

`logo-full.png`, `wordmark-bath.png` and `wordmark-craft.png` have **no alpha
channel** — the artwork is dark ink on an opaque white rectangle. That is
invisible on a white page and a white box on a dark one, and no amount of CSS
fixes a missing alpha channel.

**Light mode needed the same treatment**, for a different reason: the navbar is
`bg-surface/90` with a backdrop blur once scrolled, so it picks up the hero
photograph through it while the logo's own white stays at 100% and reads as a
box. `scripts/gen-logo-alpha.mjs` borrows the alpha channel from `logo-white.png`
— which is the artwork's coverage mask — and undoes the white composite
(`F = (C - 255(1-a)) / a`) to rebuild the coloured lockup with real transparency.
It refuses to write unless recompositing over white reproduces the original
exactly; it currently does, with a worst channel error of 0.

`logo-white.png` is the same lockup drawn in white on transparency, so the dark
theme swaps to it. It ships only as the whole 846×272 lockup, and the animation
needs the two halves separately, so `scripts/gen-logo-dark.mjs` slices it at the
same cut recorded below — local x 574, the blank column between "Bath" and
"Craft". Re-run it if the white asset is ever replaced.

The icon has a second problem, and it is contrast rather than alpha. It is
drawn in two sampled colours — slate `#4a5c72` and brand blue `#038fc2` — and
against the dark surface `#0c1b2f` those measure:

| | contrast | |
| --- | --- | --- |
| slate | **2.5:1** | below WCAG 1.4.11's 3:1 for graphical objects |
| blue | 4.7:1 | passes |

So the structural frame all but disappears and only the blue details survive.
`gen-logo-dark.mjs` recolours every layer in HSL, lifting lightness without
touching hue, which brings the worst layer from 2.45:1 to **6.9:1**. A CSS
`brightness()` filter would have been simpler and wrong — it multiplies
channels, so the blue clips and slides to cyan.

Blue lands on the dark theme's own `--color-brand` (`#3fa9dd`), so the mark
stays in step with every other blue on the page. White highlights are left
alone, and nothing is ever darkened.

The supplied logo is a flat raster, so nothing redraws it.
`scripts/gen-logo-layers.js` slices the original PNG into disjoint layers and
the animation reveals slices of those originals through animated SVG masks.
Verified against the source: the four icon layers stacked over white reproduce
the supplied crop with **zero differing pixels**, and icon + wordmark halves
recompose byte-identically. Geometry is recorded in
[`docs/logo-geometry.md`](docs/logo-geometry.md) — replace the asset and you
must re-measure and re-run the script.

## Hero video

`components/site/VideoModal.tsx`, opened by the hero's Watch Video button.
The file is served statically from `public/media/video-project-4.mp4` with
`preload="metadata"`, so landing on the page costs a few KB of header rather
than the 26MB asset; playback only ever starts from the click that opens the
dialog.

The dialog is rendered through a **portal to `<body>`**. The hero section is
`isolate`, so without the portal no z-index could lift the overlay above the
fixed navbar and it would open underneath it.

Closes on the X, on Escape, and on a backdrop press — but never on a press that
begins inside the player, so dragging the seek bar out of the frame is safe.
Closing pauses, rewinds to 0 and returns focus to the trigger with
`preventScroll`, which keeps a scrolled-down page exactly where it was.

**Note on the asset:** the supplied MP4 is a 1920x1080 file whose picture is
portrait — 9:16 — pillarboxed with black bars baked into the frames.

Below `sm` the player frame is `aspect-[9/16]` and the video is `object-cover`.
That is geometry, not a tuned crop: covering a 9:16 box with 16:9 content scales
to fit the height and shows the middle `(9/16) / (16/9)` = 31.6% of the width,
which is exactly the pillarboxed picture, so the bars fall away on their own.

Desktop still uses `contain` and shows the bars, because a 9:16 frame on a wide
screen is a tall thin column. Re-exporting the asset at its real portrait ratio
would remove the bars everywhere and let both breakpoints drop the special case.

## Accessibility

Semantic landmarks, one `h1`, keyboard-operable slider and planner, focus
trapped in the modal, visible brand-blue focus ring everywhere, descriptive alt
text, decorative images `aria-hidden`. `prefers-reduced-motion: reduce` removes
the hero settle, the reveals, the scroll cue and the logo sequence, and turns
off smooth scrolling.

## Authentication

Real, server-side authentication on [Auth.js v5](https://authjs.dev)
(`next-auth@5`) with two providers against one user account:

| Provider | Path |
| --- | --- |
| Google (OAuth 2.0 / OIDC) | `Continue with Google` → `/api/auth/callback/google` |
| Credentials (email + password) | the sign-in form, scrypt-hashed |

**Setup.** Copy `.env.example` to `.env.local` and fill it in. `AUTH_SECRET`
comes from `npx auth secret`; `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` come from
Google Cloud Console → Google Auth Platform → Clients → Web application, with:

- Authorized JavaScript origin `http://localhost:3000`
- Authorized redirect URI `http://localhost:3000/api/auth/callback/google`
- Scopes `openid`, `email`, `profile` — nothing else

**Sessions** are JWTs in an encrypted, HTTP-only cookie. No token ever reaches
client JavaScript and nothing is kept in `localStorage`. Google's authorization
request carries `state`, `nonce` and PKCE (S256), all generated and verified by
Auth.js. The flow is a full-page redirect, never a popup, so it works in iOS
Safari and in-app browsers.

**Route protection** lives in `proxy.ts` (Next 16's renamed `middleware`), which
covers `/bathrooms`, `/my-bathrooms`, `/my-plans`, `/onboarding`, `/account` and
`/planner`. Turning an unauthenticated visitor away sets `?callbackUrl=`, and
`/auth/continue` spends it after sign-in: new users go to onboarding, returning
users go to where they were headed, defaulting to `/bathrooms`. `AuthGate` is
still only a UX guard — the boundary is the proxy.

**Account linking** is explicit. Signing in with Google using an email that
already has a password account is refused (`?error=AccountExists`) rather than
silently merged; the user signs in with their password first, and clicking
Continue with Google then links the two. `allowDangerousEmailAccountLinking` is
off deliberately.

### Database — Supabase Postgres

`lib/db/types.ts` defines the `UserStore` contract. Two implementations satisfy it
and the environment picks one:

| Implementation | When | File |
| --- | --- | --- |
| Supabase Postgres | `SUPABASE_URL` **and** `SUPABASE_SERVICE_ROLE_KEY` are set | `lib/db/supabase.ts` |
| JSON file | otherwise — **development only** | `lib/db/store.ts` |

The file store cannot work on Vercel: the filesystem is read-only and each
instance keeps its own copy. It exists so `npm run dev` works with no setup, and
it logs a warning when it is the one in use.

**Setup**

1. Create a Supabase project.
2. Run [`supabase/migrations/0001_users_and_accounts.sql`](supabase/migrations/0001_users_and_accounts.sql)
   in the SQL editor. It is idempotent.
3. Put `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
4. `npm run check:db` — verifies the key reaches the project and the tables exist.

**Notes that matter**

- The **service role** key bypasses Row Level Security. It is a full-access
  credential, server-only, and must never be prefixed `NEXT_PUBLIC_`.
- RLS is enabled on both tables with **no policies**, deliberately. All access is
  server-side via the service role, so the anon key opens an empty door.
- Duplicate users are prevented by unique indexes — `lower(email)` on `users` and
  `(provider, provider_account_id)` on `accounts` — not by a lock in the process.
  Two functions racing the same first sign-in cannot both win; the loser catches
  `23505` and reads back the winner's row.
- `supabase-js` speaks HTTP rather than holding a Postgres connection, which is
  what makes it safe on serverless. No pooler needed.

Password reset remains unimplemented: `requestPasswordReset` in
`app/actions/auth.ts` always resolves without sending mail, and says so.

| Route | Contents |
| --- | --- |
| `/signin` | Sign in, sign up, forgot password and the success state -- one route, four steps, no reload between them. `?mode=signup` opens on registration. |
| `/auth/continue` | Post-authentication router: onboarding vs. dashboard vs. intended page |
| `/onboarding` | Three questions: name, intent, priorities |
| `/bathrooms` | The list, with an empty state for new accounts |

Components: `AuthLayout` `SignInForm` `SignUpForm` `ForgotPasswordForm`
`AuthSuccess` `AuthErrorNotice` `OnboardingFlow` `UserMenu` `AuthGate`, plus
shared inputs in `components/auth/fields.tsx`.

## Known gaps

- **Breakpoints were not verified on a real viewport.** The browser available
  during the build refused to resize, so 1440/1280/1024/768/390 were checked by
  code and by simulation rather than by rendering. Open it at those widths
  before you trust it.
- No `/products`, `/pricing` or `/about` routes exist yet — nav links are
  in-page anchors. `/terms` and `/privacy`, linked from the sign-up consent
  checkbox, do not exist either.
- The auth screens were verified at desktop width only, for the same reason.
- Google sign-in is wired and verified up to Google's authorization endpoint,
  but the full round trip has not been run — that needs real OAuth credentials.
