"use client";

import Link from "next/link";
import BrandLockup from "@/components/brand/BrandLockup";
import UserMenu from "@/components/auth/UserMenu";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useAuth } from "@/components/auth/AuthProvider";
import { useResolvedTheme } from "@/lib/useTheme";

interface Props {
  projectName: string;
  onRenameProject: (name: string) => void;
  onSave: () => void;
  saving?: boolean;
  savedLabel?: string | null;
}

/**
 * The studio's own header.
 *
 * Deliberately not the marketing navbar: someone mid-way through measuring a
 * room does not need "Pricing" and "About" competing with their work. What
 * stays is the way out (back to the site), the mark, what they are working on,
 * and the one action that needs an account.
 */
export function StudioHeader({
  projectName,
  onRenameProject,
  onSave,
  saving = false,
  savedLabel = null,
}: Props) {
  const t = useT();
  const { user } = useAuth();
  const dark = useResolvedTheme() === "dark";

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 text-body-soft transition-colors hover:text-brand"
          aria-label={t("Back to home")}
        >
          <Icon name="arrowRight" size={16} className="rotate-180" />
          <span className="text-[13px] font-medium max-lg:sr-only">{t("Home")}</span>
        </Link>

        <span className="h-6 w-px shrink-0 bg-hairline" aria-hidden="true" />

        {/* The mark is branding here, not navigation. Linking it to /planner
            sent anyone who clicked it back to project-type selection from
            whatever step they were on — losing their place mid-flow for a
            gesture people make absent-mindedly. The way out is "Home", above. */}
        <span className="shrink-0">
          {/* h-11 — the same lockup size as the footer, so every static mark in
              the app is one artwork at one scale. It is 137px wide, which on a
              360px phone leaves the project name about 43px once the back
              link's label is hidden: tight, but readable and tappable. */}
          <BrandLockup tone={dark ? "white" : "brand"} className="h-11 w-auto" />
        </span>

        {/* The project name is the title of the page and editable in place —
            renaming should not need a settings screen. */}
        <label className="min-w-0 flex-1 sm:flex-none sm:ml-4">
          <span className="sr-only">{t("Project name")}</span>
          <input
            value={projectName}
            onChange={(e) => onRenameProject(e.target.value)}
            className="w-full min-w-0 truncate rounded-lg border border-transparent bg-transparent px-2 py-1
                       text-[15px] font-semibold text-ink outline-none transition-colors
                       hover:border-hairline focus:border-brand focus:bg-surface-raised sm:w-56"
            aria-label={t("Project name")}
          />
        </label>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {savedLabel && (
            <span className="text-[12px] text-body-soft max-sm:hidden" role="status">
              {savedLabel}
            </span>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-pill border border-brand/45 bg-surface-raised
                       px-4 text-[13px] font-semibold text-brand transition-colors
                       hover:border-brand hover:bg-wash disabled:opacity-60"
          >
            <Icon name="bookmark" size={15} />
            {saving ? t("Saving…") : t("Save")}
          </button>
          {user && <UserMenu />}
        </div>
      </div>
    </header>
  );
}
