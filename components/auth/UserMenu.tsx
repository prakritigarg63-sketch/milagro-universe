"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon, { type IconName } from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useAuth } from "./AuthProvider";

const ITEMS: { label: string; href: string; icon: IconName }[] = [
  { label: "My Bathrooms", href: "/bathrooms", icon: "bathtub" },
  { label: "My Plans", href: "/bathrooms", icon: "layers" },
  { label: "Saved Inspiration", href: "/bathrooms", icon: "bookmark" },
  { label: "Account Settings", href: "/bathrooms", icon: "settings" },
];

/** Avatar + first name + chevron, with a dropdown that closes properly. */
export default function UserMenu() {
  const { user, signOut } = useAuth();
  const t = useT();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const initials =
    `${user.firstName.charAt(0)}${user.lastName.charAt(0) || ""}`.toUpperCase() ||
    user.email.charAt(0).toUpperCase();

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-pill py-1.5 pr-2.5 pl-1.5 transition-colors hover:bg-wash"
      >
        <Avatar image={user.image} initials={initials} />
        <span className="hidden text-[13.5px] font-semibold text-ink sm:block">
          {user.firstName}
        </span>
        <Icon
          name="chevronDown"
          size={15}
          className={`text-body-soft transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t("Account")}
          className="absolute right-0 z-50 mt-2 w-[230px] animate-[panel-in_180ms_ease-out_both] overflow-hidden rounded-[14px] border border-field bg-surface-raised shadow-lift motion-reduce:animate-none"
        >
          <div className="border-b border-field px-4 py-3">
            <p className="truncate text-[13.5px] font-semibold text-ink">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-[12px] text-body-soft">{user.email}</p>
          </div>

          <ul className="py-1.5">
            {ITEMS.map(({ label, href, icon }) => (
              <li key={label}>
                <Link
                  role="menuitem"
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13.5px] text-body transition-colors hover:bg-wash hover:text-brand"
                >
                  <Icon name={icon} size={17} />
                  {t(label)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-t border-field py-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setOpen(false);
                // signOut() navigates to "/" itself — see AuthProvider.
                await signOut();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-[13.5px] text-body transition-colors hover:bg-wash hover:text-danger"
            >
              <Icon name="logout" size={17} />
              {t("Sign Out")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Google's picture when there is one, initials on Milagro Universe blue when there is
 * not. The image can 404 or be blocked (Google rate-limits hotlinked avatars),
 * so a load error falls back rather than leaving a broken frame in the navbar.
 */
function Avatar({ image, initials }: { image: string | null; initials: string }) {
  const [failed, setFailed] = useState(false);

  if (image && !failed) {
    return (
      <Image
        src={image}
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover"
        onError={() => setFailed(true)}
        referrerPolicy="no-referrer"
        unoptimized
      />
    );
  }

  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-on-brand">
      {initials}
    </span>
  );
}
