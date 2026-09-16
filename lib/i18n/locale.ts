/**
 * Language selection, held outside React so `useSyncExternalStore` can read it.
 *
 * Mirrors lib/theme.ts deliberately — same store shape, same no-flash script,
 * same hydration handling. Two preferences that behave identically should not
 * be built two different ways.
 *
 * TRADEOFF, stated plainly: the locale lives in localStorage, not a cookie or a
 * /hi/ URL segment. That keeps the marketing pages statically rendered, which is
 * why the site is fast, but it has two consequences:
 *
 *   • The server renders English and Hindi appears on the pass after hydration.
 *   • Search engines index the English text; there is no Hindi URL to rank.
 *
 * Proper locale routing (next-intl with a [locale] segment) fixes both and is
 * the right move if Hindi SEO ever matters. It is a much larger change than a
 * toggle, so it is not this.
 */
export type Locale = "en" | "hi";

export const LOCALE_KEY = "milagro.locale";

/**
 * Runs before first paint, inlined into <head>. Sets the `lang` attribute so
 * assistive technology announces the right language from the very first frame,
 * and so the Devanagari font stack applies without waiting for React.
 */
export const LOCALE_SCRIPT = `(function(){try{var l=localStorage.getItem(${JSON.stringify(
  LOCALE_KEY,
)});if(l==="hi"){document.documentElement.lang="hi";}}catch(e){}})();`;

const listeners = new Set<() => void>();
let locale: Locale = "en";
let hydrated = false;

function emit() {
  for (const l of listeners) l();
}

function read(): Locale {
  try {
    return localStorage.getItem(LOCALE_KEY) === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
}

export function setLocale(next: Locale) {
  locale = next;
  try {
    if (next === "en") localStorage.removeItem(LOCALE_KEY);
    else localStorage.setItem(LOCALE_KEY, next);
  } catch {
    // Blocked storage: the choice holds for this page, just not the next one.
  }
  document.documentElement.lang = next;
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (!hydrated) {
    hydrated = true;
    locale = read();
  }

  // Another tab switching language should not leave this one out of sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== LOCALE_KEY) return;
    locale = read();
    document.documentElement.lang = locale;
    emit();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): Locale {
  return locale;
}

/** The server has no storage, so it renders the default. See the tradeoff above. */
export function getServerSnapshot(): Locale {
  return "en";
}
