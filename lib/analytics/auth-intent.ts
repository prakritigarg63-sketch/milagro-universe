/**
 * Carries "this person is signing in, via X" across the OAuth round trip.
 *
 * The Google path leaves the site entirely and comes back through a callback,
 * so firing `Signed In` at the button would count everyone who *opened* the
 * Google consent screen — including everyone who then closed it. The credentials
 * path does not redirect, but treating both the same way keeps one code path
 * and one definition of what the event means.
 *
 * So the forms record an intent, and AnalyticsProvider converts it into an event
 * only once a real session exists. sessionStorage rather than localStorage: the
 * intent must not outlive the tab, or an abandoned attempt would be counted days
 * later on an unrelated visit.
 */
const KEY = "milagro:auth-intent";

export type AuthIntent = {
  kind: "signin" | "signup";
  provider: "google" | "credentials";
};

export function markAuthIntent(intent: AuthIntent): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(intent));
  } catch {
    // Private mode, disabled storage, quota — the sign-in itself still works,
    // it just goes unattributed. Never worth an exception.
  }
}

/** Reads and clears in one step, so an intent can only ever produce one event. */
export function takeAuthIntent(): AuthIntent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as AuthIntent;
  } catch {
    return null;
  }
}
