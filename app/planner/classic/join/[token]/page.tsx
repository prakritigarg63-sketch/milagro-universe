"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WizardShell } from "@/components/planner/shell/WizardShell";
import { MaterialIcon } from "@/components/planner/ui/MaterialIcon";
import { useI18n } from "@/lib/planner/i18n/provider";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/mixpanel";
import { acceptInviteAction } from "@/app/planner/actions";

/**
 * Invite accept page. `/planner` is protected, so the visitor is already signed
 * in (middleware sends them through /signin first, with this URL as callback).
 * Redeem the token → become a member → open the shared project.
 */
export default function JoinPage() {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const loadProject = useProjectStore((s) => s.loadProject);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = String(params?.token ?? "");
      if (!token) {
        if (active) setError(true);
        return;
      }
      try {
        const projectId = await acceptInviteAction(token);
        if (!active) return;
        if (projectId) {
          track(EVENTS.INVITE_ACCEPTED, { project_id: projectId });
          await loadProject(projectId);
          router.replace("/planner/space");
        } else {
          setError(true);
        }
      } catch {
        if (active) setError(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [params, router, loadProject]);

  return (
    <WizardShell subtitle={t.shareTitle}>
      <div
        style={{
          padding: "64px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "var(--color-primary-tint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcon
            name={error ? "link_off" : "group_add"}
            size={28}
            color="var(--color-primary-accent)"
          />
        </div>
        <p style={{ margin: 0, fontSize: "calc(14px * var(--pl-fs, 1))", fontWeight: 700, color: "var(--color-on-surface)" }}>
          {error ? t.inviteInvalid : t.joining}
        </p>
        {error && (
          <button
            onClick={() => router.replace("/planner/space")}
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: 12,
              background: "var(--color-primary)",
              color: "var(--color-on-primary)",
              fontWeight: 700,
              fontSize: "calc(14px * var(--pl-fs, 1))",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t.goToPlanner}
          </button>
        )}
      </div>
    </WizardShell>
  );
}
