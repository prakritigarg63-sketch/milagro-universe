"use client";

import { useEffect, useRef } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser subscription to a project's realtime channel (M7).
 *
 * Pairs with the server broadcast in lib/db/realtime.ts. Uses the *anon* key
 * (NEXT_PUBLIC_*) — the browser never sees the service-role key. Broadcast needs
 * no RLS, so this works even though the app authenticates with NextAuth rather
 * than Supabase Auth. Fully gated: without the NEXT_PUBLIC Supabase env vars
 * (e.g. local dev on the file store) it is a no-op, so co-edit still works via
 * ordinary saves, just without the live push.
 */

let browserClient: SupabaseClient | null = null;
function client(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!browserClient) {
    browserClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return browserClient;
}

/** True when realtime can run (NEXT_PUBLIC Supabase env vars are present). */
export function realtimeEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

interface Handlers {
  onUpdate?: (payload: unknown) => void;
  onComment?: (payload: unknown) => void;
}

/** Subscribe to a project's channel for the lifetime of the component. */
export function useProjectRealtime(projectId: string | null, handlers: Handlers): void {
  const ref = useRef(handlers);
  // Keep the latest handlers without re-subscribing on every render.
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    if (!projectId) return;
    const c = client();
    if (!c) return;
    const channel = c
      .channel(`project:${projectId}`)
      .on("broadcast", { event: "update" }, (m) => ref.current.onUpdate?.(m.payload))
      .on("broadcast", { event: "comment" }, (m) => ref.current.onComment?.(m.payload))
      .subscribe();
    return () => {
      void c.removeChannel(channel);
    };
  }, [projectId]);
}
