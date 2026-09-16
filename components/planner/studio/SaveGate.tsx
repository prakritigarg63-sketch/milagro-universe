"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn } from "next-auth/react";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useStudioStore, type SaveIntent } from "@/lib/planner/studio/studio-store";

const COPY: Record<Exclude<SaveIntent, null>, { title: string; body: string }> = {
  save: {
    title: "Keep your bathroom plan.",
    body: "Create a free account to save your design and come back anytime.",
  },
  download: {
    title: "Keep your bathroom plan.",
    body: "Create a free account to download your plan and come back to it anytime.",
  },
  share: {
    title: "Share your bathroom plan.",
    body: "Create a free account to share this design and keep everyone on the same page.",
  },
};

/**
 * The account prompt, shown only when someone reaches for something that needs
 * one — save, download, share. Never on the way in.
 *
 * Sign-in returns to the exact planner screen the user was on, and their work
 * is claimed into the new account by `claimGuestProjects()` (see
 * lib/planner/db/index.ts), so nothing is lost and nothing is repeated.
 */
export function SaveGate() {
  const t = useT();
  const pathname = usePathname();
  const intent = useStudioStore((s) => s.saveIntent);
  const close = useStudioStore((s) => s.closeSaveGate);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Escape closes, focus moves in and comes back out. A modal that traps the
  // keyboard is worse than no modal.
  useEffect(() => {
    if (!intent) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>("a,button")?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus();
    };
  }, [intent, close]);

  if (!intent) return null;

  const copy = COPY[intent];
  const back = pathname || "/planner";
  const continueUrl = `/auth/continue?next=${encodeURIComponent(back)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-gate-title"
        className="w-full max-w-md rounded-t-3xl border border-hairline bg-surface-raised p-6 shadow-[0_24px_60px_rgb(16_43_78/0.22)] sm:rounded-3xl sm:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-wash">
            <Icon name="bookmark" size={20} className="text-brand" />
          </div>
          <button
            type="button"
            onClick={close}
            className="-m-2 rounded-full p-2 text-body-soft transition-colors hover:bg-wash hover:text-ink"
            aria-label={t("Close")}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <h2 id="save-gate-title" className="text-[22px] font-semibold leading-tight text-ink">
          {t(copy.title)}
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-body">{t(copy.body)}</p>

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={() => void signIn("google", { callbackUrl: continueUrl })}
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-pill border border-hairline
                       bg-surface text-sm font-semibold text-ink transition-colors hover:bg-wash"
          >
            <GoogleMark />
            {t("Continue with Google")}
          </button>

          <Link
            href={`/signin?mode=signup&callbackUrl=${encodeURIComponent(back)}`}
            className="flex h-12 w-full items-center justify-center rounded-pill bg-clay text-sm
                       font-semibold text-on-clay transition-colors hover:bg-clay-dark"
          >
            {t("Continue with Email")}
          </Link>
        </div>

        <p className="mt-5 text-center text-[13px] text-body-soft">
          {t("Already have an account?")}{" "}
          <Link
            href={`/signin?callbackUrl=${encodeURIComponent(back)}`}
            className="font-semibold text-brand hover:underline"
          >
            {t("Sign in")}
          </Link>
        </p>

        <p className="mt-4 text-center text-[12px] text-body-soft">
          {t("Your plan stays in this browser until you do.")}
        </p>
      </div>
    </div>
  );
}

/** Google's mark, inline so the button does not depend on a network image. */
function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 2-1.6 5-4.5 7l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15.6z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.700000000000001l-7.1 5.5C7.9 40.9 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.5 27.9c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4l-7.1-5.5C2.9 16.5 2 20.1 2 23.5s.9 7 2.4 9.9z"
      />
      <path
        fill="#EA4335"
        d="M24 10.9c3.2 0 6 1.1 8.2 3.2l6.1-6.1C34.9 4.5 29.9 2 24 2 15.4 2 7.9 7.1 4.4 13.6l7.1 5.5C13.3 14.7 18.2 10.9 24 10.9z"
      />
    </svg>
  );
}
