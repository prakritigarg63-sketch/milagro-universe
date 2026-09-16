"use client";
import { ComingSoon } from "@/components/planner/shell/ComingSoon";
import { useI18n } from "@/lib/planner/i18n/provider";
export default function GuidesPage() {
  const { t } = useI18n();
  return <ComingSoon title={t.navGuides} icon="menu_book" subtitle="Brand guides, jargon decoder and inspiration — coming soon." />;
}
