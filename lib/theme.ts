/**
 * Theme selection, held outside React so `useSyncExternalStore` can read it.
 *
 * Three states, not two. "system" is the default and follows the OS; "light"
 * and "dark" are explicit overrides. Collapsing this to a boolean would lose
 * the difference between "I want light" and "I haven't chosen", and the page
 * would stop following the OS when it flips at sunset.
 */
export type Theme = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "milagro.theme";

/**
 * Runs before first paint, inlined into <head>. Kept as a string because it
 * must execute ahead of React — a component cannot set this early enough, and
 * the gap shows up as a white flash on a dark page.
 *
 * Only an explicit choice writes the attribute. Absent it, the CSS media query
 * in globals.css decides, so the markup is identical on server and client.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

const listeners = new Set<() => void>();
let theme: Theme = "system";
let hydrated = false;

function emit() {
  for (const l of listeners) l();
}

function read(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "dark" || v === "light" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(next: Theme) {
  const root = document.documentElement;
  if (next === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", next);
}

export function setTheme(next: Theme) {
  theme = next;
  try {
    if (next === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, next);
  } catch {
    // Blocked storage: the choice holds for this page, just not the next one.
  }
  apply(next);
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (!hydrated) {
    hydrated = true;
    theme = read();
  }

  // The OS preference can change while the page is open. Only repaint the
  // toggle's icon — the CSS media query has already handled the colours.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", emit);

  // Another tab changing the theme should not leave this one out of sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_KEY) return;
    theme = read();
    apply(theme);
    emit();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", emit);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): Theme {
  return theme;
}

/** The server has no OS preference and no storage, so it renders the default. */
export function getServerSnapshot(): Theme {
  return "system";
}

export function resolve(value: Theme): ResolvedTheme {
  if (value !== "system") return value;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * What is actually on screen right now. Read through useSyncExternalStore so
 * the hydration render uses the server value and the browser value arrives on
 * the pass after — never mid-render, which is what causes the mismatch.
 */
export function getResolvedSnapshot(): ResolvedTheme {
  return resolve(theme);
}

export function getResolvedServerSnapshot(): ResolvedTheme {
  return "light";
}
