"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import BrandLockup from "@/components/brand/BrandLockup";
import { useT } from "@/lib/i18n/useT";
import { useAuth } from "@/components/auth/AuthProvider";
import { useResolvedTheme } from "@/lib/useTheme";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { acceptInviteAction } from "@/app/planner/actions";
import { EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/mixpanel";

type State = "checking" | "needsAuth" | "redeeming" | "error";

/**
 * Redeem a share link.
 *
 * `/planner` is open to anonymous visitors, so unlike the old wizard's join
 * page this one cannot assume a session. A signed-out visitor is told what the
 * link is and sent to sign in with this URL as the callback, rather than being
 * shown "invalid link" for a link that is perfectly valid.
 *
 * The token is only ever redeemed server-side, where the acting user is taken
 * from the session — the client cannot name whose account gets access.
 */
export default function StudioJoinPage() {
  const t = useT();
  const params = useParams();
  const router = useRouter();
  const { user, ready } = useAuth();
  const dark = useResolvedTheme() === "dark";
  const loadProject = useProjectStore((s) => s.loadProject);

  // Only the redemption outcome is state; everything else is derived, so the
  // effect never sets state synchronously and cannot cascade a render.
  const [failed, setFailed] = useState(false);
  const attempted = useRef(false);

  const token = String(params?.token ?? "");
  const here = `/planner/join/${token}`;

  const state: State = !ready
    ? "checking"
    : !token || failed
      ? "error"
      : !user
        ? "needsAuth"
        : "redeeming";

  /**
   * Cancellation is scoped to unmount, not to effect re-runs.
   *
   * A per-run `active` flag looks equivalent but is not: this redeem happens
   * once (`attempted`), so if a dependency merely changes identity — the
   * session object refreshing is enough — the cleanup would discard the
   * in-flight result while the guard blocks any retry, and the page sits on
   * "Opening…" forever.
   */
  const unmounted = useRef(false);
  useEffect(() => {
    // Re-armed on mount, not just set on unmount. React Strict Mode mounts,
    // unmounts and remounts in development; a ref survives that remount, so a
    // cleanup-only flag latches true on the throwaway unmount and silently
    // discards every result from then on.
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !token || !user || attempted.current) return;
    attempted.current = true;

    (async () => {
      try {
        const projectId = await acceptInviteAction(token);
        if (unmounted.current) return;
        if (!projectId) {
          setFailed(true);
          return;
        }
        track(EVENTS.INVITE_ACCEPTED, { project_id: projectId });
        await loadProject(projectId);
        if (!unmounted.current) router.replace("/planner/plan");
      } catch {
        if (!unmounted.current) setFailed(true);
      }
    })();
  }, [ready, user, token, loadProject, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-5 py-16">
      <Link href="/" aria-label={t("Milagro Universe — home")}>
        <BrandLockup tone={dark ? "white" : "brand"} className="h-11 w-auto" />
      </Link>

      <div className="mt-10 w-full max-w-md rounded-2xl border border-hairline bg-surface-raised p-7 text-center">
        {state === "needsAuth" ? (
          <>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-wash">
              <Icon name="people" size={22} className="text-brand" />
            </span>
            <h1 className="mt-4 text-[22px] font-semibold leading-snug text-ink">
              {t("You’ve been invited to a bathroom plan.")}
            </h1>
            <p className="mt-2 text-[14.5px] leading-relaxed text-body">
              {t("Sign in to open it. You’ll be able to view and edit the plan together.")}
            </p>
            <Link
              href={`/signin?callbackUrl=${encodeURIComponent(here)}`}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-pill bg-clay
                         text-[14px] font-semibold text-on-clay transition-colors hover:bg-clay-dark"
            >
              {t("Sign in to open the plan")}
            </Link>
            <Link
              href="/planner"
              className="mt-3 block text-[13px] font-medium text-brand hover:underline"
            >
              {t("Or plan your own bathroom")}
            </Link>
          </>
        ) : state === "error" ? (
          <>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10">
              <Icon name="warning" size={22} className="text-danger" />
            </span>
            <h1 className="mt-4 text-[22px] font-semibold leading-snug text-ink">
              {t("This link isn’t valid any more.")}
            </h1>
            <p className="mt-2 text-[14.5px] leading-relaxed text-body">
              {t("Share links expire after 30 days. Ask for a fresh one, or start your own plan.")}
            </p>
            <Link
              href="/planner"
              className="mt-6 flex h-12 w-full items-center justify-center rounded-pill bg-clay
                         text-[14px] font-semibold text-on-clay transition-colors hover:bg-clay-dark"
            >
              {t("Plan a bathroom")}
            </Link>
          </>
        ) : (
          <p role="status" className="py-6 text-[14.5px] text-body">
            {t("Opening the shared plan…")}
          </p>
        )}
      </div>
    </div>
  );
}
