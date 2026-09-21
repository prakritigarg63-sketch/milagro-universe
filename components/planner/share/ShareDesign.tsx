"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { finishSummary } from "@/lib/planner/share/summary";
import { composeShareCard } from "@/lib/planner/share/card";
import type { RoomSceneApi } from "@/components/planner/studio/Room3DWebGL";
import type { Project } from "@/lib/planner/types";

/**
 * Section C — take your design out of the app.
 *
 * Captures the exact 3D view the homeowner has framed, composes it with a
 * finishes summary into one branded image, and offers it to download or share
 * (native share sheet on a phone → WhatsApp, Messages, etc.). Nothing leaves the
 * device except through the OS share sheet the user drives themselves.
 */

/**
 * Whether this browser can share files through the OS share sheet. Read through
 * useSyncExternalStore (never during an effect) so it is false on the server and
 * the real capability on the client, without a hydration flash. Cached — the
 * answer never changes within a session.
 */
let shareCapable: boolean | null = null;
function detectShareCapable(): boolean {
  if (shareCapable !== null) return shareCapable;
  try {
    const probe = new File([new Blob()], "probe.png", { type: "image/png" });
    shareCapable = Boolean(navigator.canShare?.({ files: [probe] }));
  } catch {
    shareCapable = false;
  }
  return shareCapable;
}
const noopSubscribe = () => () => {};
export function ShareDesign({
  project,
  sceneRef,
}: {
  project: Project;
  sceneRef: React.RefObject<RoomSceneApi | null>;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const canNativeShare = useSyncExternalStore(noopSubscribe, detectShareCapable, () => false);

  // Close the preview on Escape.
  useEffect(() => {
    if (!image) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setImage(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [image]);

  async function build() {
    const api = sceneRef.current;
    if (!api) {
      setError(true);
      return;
    }
    setBusy(true);
    setError(false);
    try {
      const render = api.capture(1000, 640);
      const rows = finishSummary(project.finishes).map((r) => ({
        ...r,
        label: t(r.label),
        value: t(r.value),
      }));
      const room = project.room;
      const subtitle = room
        ? `${Math.round(room.lengthInches / 12)} × ${Math.round(room.widthInches / 12)} ft`
        : "";
      const url = await composeShareCard(render, {
        brand: "Milagro",
        title: t("Your bathroom design"),
        subtitle,
        finishesLabel: t("Finishes"),
        footer: "milagro-universe.vercel.app",
        rows,
      });
      setImage(url);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function shareNative() {
    if (!image) return;
    try {
      const blob = await (await fetch(image)).blob();
      const file = new File([blob], "milagro-bathroom.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t("My bathroom design") });
      }
    } catch {
      /* the user dismissed the share sheet, or it is unsupported — no-op */
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={build}
        disabled={busy}
        className="inline-flex h-10 items-center gap-1.5 rounded-pill border border-hairline bg-surface-raised px-4 text-[13px] font-semibold text-ink transition-colors hover:border-brand/45 disabled:opacity-60"
      >
        <Icon name="bag" size={15} />
        {busy ? t("Preparing your image…") : t("Share design")}
      </button>

      {error && (
        <span role="status" className="text-[12.5px] text-danger">
          {t("Couldn't create the image. Please try again.")}
        </span>
      )}

      {image && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("Your bathroom design")}
          onClick={(e) => e.target === e.currentTarget && setImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm"
        >
          <div className="flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-raised shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
              <h2 className="text-[15px] font-semibold text-ink">{t("Share your design")}</h2>
              <button
                type="button"
                onClick={() => setImage(null)}
                aria-label={t("Close")}
                className="-m-2 rounded-full p-2 text-body-soft transition-colors hover:bg-wash hover:text-ink"
              >
                <Icon name="close" size={17} />
              </button>
            </div>

            <div className="overflow-y-auto p-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- a runtime-generated data URL, not a static asset */}
              <img
                src={image}
                alt={t("Your bathroom design, ready to share")}
                className="mx-auto w-full rounded-xl border border-hairline"
              />
            </div>

            <div className="flex gap-2 border-t border-hairline p-4">
              {canNativeShare && (
                <button
                  type="button"
                  onClick={shareNative}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-pill bg-clay text-[13.5px] font-semibold text-on-clay transition-colors hover:bg-clay-dark"
                >
                  <Icon name="bag" size={15} /> {t("Share")}
                </button>
              )}
              <a
                href={image}
                download="milagro-bathroom.png"
                className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-pill border border-hairline text-[13.5px] font-semibold text-ink transition-colors hover:bg-wash"
              >
                <Icon name="arrowDown" size={15} /> {t("Download image")}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
