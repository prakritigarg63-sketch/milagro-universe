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

/** The editable page title. The same control in both header layouts. */
function ProjectNameInput({
  value,
  onChange,
  label,
  className,
}: {
  value: string;
  onChange: (name: string) => void;
  label: string;
  className: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`min-w-0 truncate rounded-lg border border-transparent bg-transparent px-2 py-1
                  text-[15px] font-semibold text-ink outline-none transition-colors
                  hover:border-hairline focus:border-brand focus:bg-surface-raised ${className}`}
      aria-label={label}
    />
  );
}

/**
 * The studio's own header.
 *
 * Deliberately not the marketing navbar: someone mid-way through measuring a
 * room does not need "Pricing" and "About" competing with their work. What
 * stays is the way out, the mark, what they are working on, and the one action
 * that needs an account.
 *
 * Two layouts, because four things do not fit across a phone. From `sm` up it
 * is one row. Below that the project name — the title of the page — drops to a
 * row of its own rather than being squeezed into the ~43px left between the
 * mark and the Save button.
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
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <div className="flex h-16 items-center gap-3 sm:gap-4">
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
              gesture people make absent-mindedly. The way out is "Home", above.
              h-11 matches the footer, so every static mark is one scale. */}
          <span className="shrink-0">
            <BrandLockup tone={dark ? "white" : "brand"} className="h-11 w-auto" />
          </span>

          {/* Inline from sm up; see the phone row below. */}
          <label className="ml-4 hidden min-w-0 sm:block">
            <span className="sr-only">{t("Project name")}</span>
            <ProjectNameInput
              value={projectName}
              onChange={onRenameProject}
              label={t("Project name")}
              className="w-56"
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

        {/* Phones only — the title of the page, with room to read it. */}
        <label className="block pb-2 sm:hidden">
          <span className="sr-only">{t("Project name")}</span>
          <ProjectNameInput
            value={projectName}
            onChange={onRenameProject}
            label={t("Project name")}
            className="w-full"
          />
        </label>
      </div>
    </header>
  );
}
