"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/planner/i18n/provider";
import { MaterialIcon } from "@/components/planner/ui/MaterialIcon";

export const PLANNER_NAV = [
  { key: "navBathrooms", icon: "bathtub", href: "/bathrooms" },
  { key: "navPlanner", icon: "architecture", href: "/planner/classic/space" },
  { key: "navGuides", icon: "menu_book", href: "/planner/classic/guides" },
  { key: "navDocs", icon: "folder_shared", href: "/planner/classic/docs" },
] as const;

/** "Planner" stays active across every wizard step; guides and docs are their
 *  own /planner sub-routes, so they are excluded from the Planner match. */
export function isNavActive(pathname: string, item: (typeof PLANNER_NAV)[number]) {
  if (item.key === "navPlanner") {
    return (
      pathname.startsWith("/planner/classic") &&
      !pathname.startsWith("/planner/classic/guides") &&
      !pathname.startsWith("/planner/classic/docs")
    );
  }
  return pathname.startsWith(item.href);
}

/** Phone tab bar. On laptops the same destinations live in the header. */
export function BottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <nav className="pl-bottomnav" aria-label={t.appName}>
      {PLANNER_NAV.map((item) => {
        const active = isNavActive(pathname, item);
        return (
          <Link
            key={item.key}
            href={item.href}
            className="pl-bottomnav-link"
            aria-current={active ? "page" : undefined}
          >
            <MaterialIcon name={item.icon} size={22} />
            <span>{t[item.key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
