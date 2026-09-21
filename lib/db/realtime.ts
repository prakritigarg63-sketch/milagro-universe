import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server → client realtime, via Supabase Broadcast (M7).
 *
 * The app authenticates with NextAuth, not Supabase Auth, so Supabase's
 * RLS-authorised "postgres changes" stream is not available to the browser.
 * Broadcast sidesteps that: the server (holding the service-role key) posts a
 * message to a per-project channel, and any co-editor subscribed to that channel
 * receives it. No table replication, no RLS dependency.
 *
 * Best-effort and fully gated: with no Supabase configured (local file store)
 * this is a no-op, so nothing here runs or fails in development. Sending uses the
 * HTTP broadcast endpoint (no long-lived socket in a serverless function).
 */

export type ProjectEvent = "update" | "comment";

let rtClient: SupabaseClient | null = null;
function realtimeClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!rtClient) {
    rtClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return rtClient;
}

/** The channel name a project's co-editors share. Public-but-unguessable (UUID). */
export function projectChannel(projectId: string): string {
  return `project:${projectId}`;
}

/** Broadcast an event to a project's channel. No-op without Supabase. */
export async function broadcastToProject(
  projectId: string,
  event: ProjectEvent,
  payload: unknown,
): Promise<void> {
  const client = realtimeClient();
  if (!client) return;
  try {
    // On an un-subscribed channel, send() posts to the HTTP broadcast endpoint.
    const channel = client.channel(projectChannel(projectId));
    await channel.send({ type: "broadcast", event, payload });
    await client.removeChannel(channel);
  } catch {
    // Realtime is a live-nicety, never a source of truth — never fail a write for it.
  }
}
