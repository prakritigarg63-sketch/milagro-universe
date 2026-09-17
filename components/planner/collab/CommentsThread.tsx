"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useAuth } from "@/components/auth/AuthProvider";
import { addCommentAction, deleteCommentAction, listCommentsAction } from "@/app/planner/actions";
import { useProjectRealtime } from "@/lib/planner/realtime/client";
import type { ProjectComment } from "@/lib/db/projects";

/**
 * Threaded comments on a project (M7). Anyone who can open the project — the
 * owner or an invited expert — can post. New comments from a co-editor arrive
 * live when realtime is configured (Supabase); otherwise they appear on the next
 * load. Posting and deleting always work, through the server actions.
 */
export function CommentsThread({ projectId }: { projectId: string }) {
  const t = useT();
  const { user } = useAuth();
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    listCommentsAction(projectId)
      .then((c) => active && (setComments(c), setLoaded(true)))
      .catch(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [projectId]);

  // Live append when a co-editor posts (no-op without realtime configured).
  useProjectRealtime(projectId, {
    onComment: (payload) => {
      const c = payload as ProjectComment;
      if (c?.id) setComments((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]));
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || pending) return;
    setPending(true);
    try {
      const c = await addCommentAction(projectId, text);
      setComments((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]));
      setBody("");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteCommentAction(id);
    } catch {
      /* best-effort; the list refreshes on next load */
    }
  }

  return (
    <section className="rounded-2xl border border-hairline bg-surface-raised p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Icon name="people" size={17} className="text-brand" />
        <h2 className="text-[17px] font-semibold text-ink">{t("Comments")}</h2>
        {comments.length > 0 && (
          <span className="rounded-full bg-wash px-2 py-0.5 text-[11.5px] font-semibold text-body-soft">
            {comments.length}
          </span>
        )}
      </div>

      <ul className="mt-4 space-y-3">
        {comments.map((c) => {
          const mine = c.authorId === user?.id;
          return (
            <li key={c.id} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[12px] font-semibold text-brand"
              >
                {(c.authorName || "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[13.5px] font-semibold text-ink">{c.authorName || t("Member")}</span>
                  <time className="text-[11.5px] text-body-soft" dateTime={c.createdAt}>
                    {new Date(c.createdAt).toLocaleString()}
                  </time>
                  {mine && (
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      className="ml-auto text-[11.5px] font-semibold text-body-soft transition-colors hover:text-danger"
                    >
                      {t("Delete")}
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-body">
                  {c.body}
                </p>
              </div>
            </li>
          );
        })}
        {loaded && comments.length === 0 && (
          <li className="text-[13.5px] text-body-soft">{t("No comments yet. Start the conversation.")}</li>
        )}
      </ul>

      <form onSubmit={submit} className="mt-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder={t("Add a comment for your expert or homeowner…")}
          className="w-full resize-y rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-[14px] text-ink placeholder:text-body-soft/70 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/12"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="inline-flex h-10 items-center gap-1.5 rounded-pill bg-clay px-5 text-[13.5px] font-semibold text-on-clay transition-[transform,background-color,opacity] duration-200 hover:-translate-y-px hover:bg-clay-dark disabled:opacity-45 motion-reduce:hover:translate-y-0"
          >
            {pending ? t("Posting…") : t("Post comment")}
          </button>
        </div>
      </form>
    </section>
  );
}
