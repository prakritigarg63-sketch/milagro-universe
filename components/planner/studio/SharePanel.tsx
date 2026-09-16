"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { createInviteAction, listMembersAction } from "@/app/planner/actions";
import { EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/mixpanel";
import type { MemberInfo } from "@/lib/db/projects";

interface Props {
  projectId: string;
  onClose: () => void;
}

/**
 * Share this plan with someone who can edit it.
 *
 * The link is a real, server-minted invite — not the current URL. That
 * distinction matters: a planner URL carries no project identity, so sending
 * one to a friend shows them *their* bathroom. A token names this project and
 * grants the holder edit access to it, which is why it is generated on demand
 * rather than sitting in the page waiting to be copied by accident.
 *
 * The token is a bearer credential. Anyone holding the link can edit the plan,
 * so the copy says so plainly rather than leaving the homeowner to find out.
 */
export function SharePanel({ projectId, onClose }: Props) {
  const t = useT();
  const [link, setLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [status, setStatus] = useState<"idle" | "creating" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    listMembersAction(projectId)
      .then((list) => {
        if (active) setMembers(list);
      })
      .catch(() => {
        /* the panel still works without the member list */
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  async function createLink() {
    setStatus("creating");
    try {
      const invite = await createInviteAction(projectId);
      const url = `${window.location.origin}/planner/join/${invite.token}`;
      setLink(url);
      setExpiresAt(invite.expiresAt);
      setStatus("idle");
      track(EVENTS.INVITE_CREATED, { project_id: projectId });
    } catch {
      setStatus("error");
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard can be blocked; the input below is selectable either way.
      setCopied(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="w-full max-w-md rounded-t-3xl border border-hairline bg-surface-raised p-6 shadow-[0_24px_60px_rgb(16_43_78/0.22)] sm:rounded-3xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="share-title" className="text-[20px] font-semibold text-ink">
              {t("Share this plan")}
            </h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-body">
              {t("Send a link to your contractor, designer or partner so they can work on it with you.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close")}
            className="-m-2 shrink-0 rounded-full p-2 text-body-soft transition-colors hover:bg-wash hover:text-ink"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {!link ? (
          <>
            <button
              type="button"
              onClick={createLink}
              disabled={status === "creating"}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-clay
                         text-[14px] font-semibold text-on-clay transition-colors hover:bg-clay-dark
                         disabled:opacity-60"
            >
              <Icon name="swap" size={16} />
              {status === "creating" ? t("Creating link…") : t("Create a share link")}
            </button>
            {status === "error" && (
              <p className="mt-2.5 text-[12.5px] text-danger" role="alert">
                {t("Could not create the link. Only the plan’s owner can share it.")}
              </p>
            )}
          </>
        ) : (
          <>
            <label className="mt-5 block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-body">
                {t("Anyone with this link can edit the plan")}
              </span>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={link}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 border border-hairline bg-surface px-3 py-2.5 text-[13px] text-ink"
                  style={{ borderRadius: 12 }}
                  aria-label={t("Share link")}
                />
                <button
                  type="button"
                  onClick={copy}
                  className="shrink-0 rounded-pill bg-brand px-4 text-[13px] font-semibold text-on-brand transition-colors hover:bg-brand-dark"
                >
                  {copied ? t("Copied") : t("Copy")}
                </button>
              </div>
            </label>
            {expiresAt && (
              <p className="mt-2 text-[12px] text-body-soft">
                {t("Expires")}{" "}
                {new Date(expiresAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </>
        )}

        {members.length > 0 && (
          <div className="mt-6 border-t border-hairline pt-4">
            <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-body-soft">
              {t("Who has access")}
            </h3>
            <ul className="mt-2.5 space-y-1.5">
              {members.map((member) => (
                <li
                  key={member.userId}
                  className="flex items-center justify-between gap-3 text-[13.5px]"
                >
                  <span className="truncate text-ink">{member.name}</span>
                  <span className="shrink-0 rounded-pill bg-wash px-2 py-0.5 text-[11.5px] font-medium text-body">
                    {t(member.role === "owner" ? "Owner" : "Can edit")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
