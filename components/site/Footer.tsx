"use client";

import Link from "next/link";
import BrandLockup from "@/components/brand/BrandLockup";
import Icon from "@/components/ui/Icon";
import { FOOTER_LINKS, SOCIALS } from "@/lib/content";
import { useT } from "@/lib/i18n/useT";
import { useResolvedTheme } from "@/lib/useTheme";

/** White footer. The logo here is the static lockup — it has already animated. */
export default function Footer() {
  const t = useT();
  // The supplied rasters have no alpha — see MilagroLogoAnimation.
  const dark = useResolvedTheme() === "dark";
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto flex max-w-[1280px] 2xl:max-w-[1440px] flex-col gap-8 px-5 py-10 sm:px-6 lg:flex-row lg:items-center lg:gap-10">
        <div className="shrink-0">
          <BrandLockup tone={dark ? "white" : "brand"} className="h-11 w-auto" />
          <p className="mt-2 text-[13px] text-body-soft">{t("Plan Better. Build Smarter.")}</p>
        </div>

        <nav aria-label="Footer" className="lg:mx-auto">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-[15px] text-body transition-colors hover:text-brand"
                >
                  {t(label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="flex items-center gap-2">
          {SOCIALS.map(({ label, href, icon }) => (
            <li key={label}>
              <a
                href={href}
                aria-label={t(label)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-body transition-colors hover:bg-wash hover:text-brand max-sm:h-11 max-sm:w-11"
              >
                <Icon name={icon} size={18} />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto max-w-[1280px] 2xl:max-w-[1440px] px-5 pb-8 text-right text-[13px] text-body-soft sm:px-6">
        © {new Date().getFullYear()} Milagro Universe. {t("All rights reserved.")}
      </div>
    </footer>
  );
}
