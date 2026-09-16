"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MilagroLogoAnimation from "@/components/MilagroLogoAnimation";
import Button from "@/components/ui/Button";
import UserMenu from "@/components/auth/UserMenu";
import LanguageToggle from "@/components/ui/LanguageToggle";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import Icon from "@/components/ui/Icon";
import { NAV_LINKS } from "@/lib/content";
import { useT } from "@/lib/i18n/useT";

/**
 * Sticky navbar, 72px. Transparent-bordered over the top of the page; once the
 * user scrolls it picks up a hairline, a soft shadow and a backdrop blur so it
 * separates from the hero photograph underneath.
 */
export default function Navbar() {
  const { user, ready } = useAuth();
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // "Get Started" means register when signed out, and "plan a bathroom" once
  // signed in -- the button keeps its label but not its destination.
  const getStartedHref = user ? "/onboarding" : "/signin?mode=signup";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A menu that stays open behind a resize to desktop would trap focus.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const close = () => mq.matches && setOpen(false);
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-[box-shadow,background-color,backdrop-filter] duration-300",
        scrolled
          ? "bg-surface/90 shadow-[0_1px_0_var(--color-hairline),0_6px_24px_rgb(16_43_78/0.06)] backdrop-blur-md"
          : "bg-surface",
      ].join(" ")}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-[72px] max-w-[1280px] 2xl:max-w-[1440px] items-center gap-6 px-5 sm:px-6"
      >
        <Link href="#top" aria-label={t("Milagro Universe — home")} className="shrink-0">
          <MilagroLogoAnimation variant="navbar" />
        </Link>

        <ul className="mx-auto hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <Link
                href={href}
                className="text-[15.5px] font-medium text-body transition-colors hover:text-brand"
              >
                {t(label)}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2.5 lg:ml-0">
          <button
            type="button"
            aria-label={t("Search")}
            className="hidden h-10 w-10 items-center justify-center rounded-full text-body transition-colors hover:bg-wash hover:text-brand sm:inline-flex"
          >
            <Icon name="search" size={20} />
          </button>

          <LanguageToggle />

          <ThemeToggle />

          {/* Hold the slot until the stored profile has been read, so the
              signed-out pair never flashes in front of a signed-in user. */}
          {!ready ? (
            <span className="hidden h-10 w-[190px] sm:block" aria-hidden="true" />
          ) : user ? (
            <UserMenu />
          ) : (
            <>
              {/* max-sm:hidden, not "hidden sm:inline-flex": Button's base class
                  list already sets inline-flex, and two display utilities in the
                  same layer are resolved by Tailwind's output order rather than
                  by the order they appear here — so "hidden" lost and these
                  stayed visible on phones, pushing the menu button off screen. */}
              {/* Sign in is an icon, like the search and theme controls beside it.
                  The link keeps "Sign in" as its accessible name. */}
              <Link
                href="/signin"
                aria-label={t("Sign in")}
                title={t("Sign in")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-body transition-colors hover:border-brand hover:text-brand max-sm:hidden"
              >
                <Icon name="user" size={20} />
              </Link>
              <Button
                href={getStartedHref}
                variant="primary"
                size="sm"
                className="max-sm:hidden"
              >
                {t("Get Started")}
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("Close menu") : t("Open menu")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-wash max-sm:h-11 max-sm:w-11 lg:hidden"
          >
            <Icon name={open ? "close" : "menu"} size={22} />
          </button>
        </div>
      </nav>

      {/* Mobile navigation. Rendered always so the panel can transition, but
          removed from the tab order and the a11y tree while closed. */}
      <div
        id="mobile-nav"
        inert={!open ? true : undefined}
        className={[
          "overflow-hidden border-t border-hairline bg-surface transition-[max-height,opacity] duration-300 lg:hidden",
          open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <ul className="mx-auto max-w-[1280px] 2xl:max-w-[1440px] px-5 py-4">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className="block border-b border-hairline py-3 text-[16px] font-medium text-ink last:border-0"
              >
                {t(label)}
              </Link>
            </li>
          ))}
          <li className="flex gap-3 pt-4">
            {user ? (
              <Button href="/bathrooms" variant="primary" size="md" className="flex-1">
                {t("My Bathrooms")}
              </Button>
            ) : (
              <>
                <Link
                  href="/signin"
                  aria-label={t("Sign in")}
                  title={t("Sign in")}
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-hairline text-body transition-colors hover:border-brand hover:text-brand"
                >
                  <Icon name="user" size={22} />
                </Link>
                <Button href={getStartedHref} variant="primary" size="md" className="flex-1">
                  {t("Get Started")}
                </Button>
              </>
            )}
          </li>
        </ul>
      </div>
    </header>
  );
}
