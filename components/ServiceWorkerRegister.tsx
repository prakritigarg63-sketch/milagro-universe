"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (M8) once the page has loaded.
 *
 * Production only: a service worker in development caches the dev bundle and
 * fights hot reload. It registers after `load` so it never competes with the
 * first paint for bandwidth.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is a progressive enhancement; never surface a failure */
      });
    };

    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
