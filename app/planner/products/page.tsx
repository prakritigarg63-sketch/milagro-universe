"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { StudioShell } from "@/components/planner/studio/StudioShell";
import { StepFooter } from "@/components/planner/studio/StepFooter";
import { BAND_LABEL, buildSuggestions, type CategorySuggestion } from "@/lib/planner/studio/products";
import { formatInr } from "@/lib/planner/units";
import type { ProductCategory, ProductOption } from "@/lib/planner/types";

/**
 * Screen 9 — the products.
 *
 * Only categories the layout actually contains, only options that fit the room
 * and the tier. Alternatives are framed as Save / Recommended / Upgrade rather
 * than as a price-sorted list, because the question a homeowner is asking here
 * is "is this the right amount to spend on a tap", not "what is cheapest".
 */
export default function ProductsPage() {
  const t = useT();
  const { project } = useEnsureProject();
  const setProduct = useProjectStore((s) => s.setProduct);

  const [openCategory, setOpenCategory] = useState<ProductCategory | null>(null);

  const room = project?.room;
  const fixtures = useMemo(
    () => project?.placedFixtures ?? project?.plan?.fixtures ?? [],
    [project?.placedFixtures, project?.plan?.fixtures],
  );

  const suggestions = useMemo(
    () =>
      room
        ? buildSuggestions(
            fixtures,
            room,
            project?.style.costTier ?? "costEffective",
            project?.styleDirection ?? null,
          )
        : [],
    [fixtures, room, project?.style.costTier, project?.styleDirection],
  );

  const selections = project?.products ?? {};

  function chosenFor(group: CategorySuggestion): ProductOption {
    const id = selections[group.category];
    return group.options.find((o) => o.id === id) ?? group.options[0];
  }

  return (
    <StudioShell stepId="products" footer={<StepFooter stepId="products" />}>
      <header className="max-w-2xl">
        <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[38px]">
          {t("Products selected for your bathroom.")}
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-body">
          {t("Chosen for your room size, layout, style and spending tier. Swap anything you like.")}
        </p>
      </header>

      <div className="mt-9 space-y-4">
        {suggestions.map((group) => {
          const chosen = chosenFor(group);
          const open = openCategory === group.category;
          return (
            <section
              key={group.category}
              className="overflow-hidden rounded-2xl border border-hairline bg-surface-raised"
            >
              <div className="flex flex-wrap items-start gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <span className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-body-soft">
                    {t(group.label)}
                  </span>

                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <h2 className="text-[18px] font-semibold text-ink">{t(chosen.name)}</h2>
                    <span className="text-[13.5px] text-body">{chosen.brand}</span>
                    {chosen.band === "recommended" && (
                      <span className="rounded-pill bg-wash px-2 py-0.5 text-[11px] font-semibold text-brand ring-1 ring-brand/25">
                        {t("Recommended")}
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 text-[17px] font-semibold text-ink">
                    {formatInr(chosen.indicativePriceInr)}
                    {group.priceUnit && (
                      <span className="ml-1 text-[13px] font-normal text-body-soft">
                        {t(group.priceUnit)}
                      </span>
                    )}
                    <span className="ml-2 text-[12px] font-normal text-body-soft">
                      {t("Indicative price")}
                    </span>
                  </p>

                  <ul className="mt-3 space-y-1">
                    {chosen.whyItFits.map((why) => (
                      <li key={why} className="flex items-start gap-1.5 text-[13px] text-body">
                        <Icon name="check" size={13} className="mt-0.5 shrink-0 text-brand/70" />
                        {t(why)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setProduct(group.category, chosen.id)}
                    aria-pressed={selections[group.category] === chosen.id}
                    className={[
                      "h-10 rounded-pill px-4 text-[13px] font-semibold transition-colors",
                      selections[group.category] === chosen.id
                        ? "bg-brand text-on-brand"
                        : "bg-clay text-on-clay hover:bg-clay-dark",
                    ].join(" ")}
                  >
                    {selections[group.category] === chosen.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="check" size={14} />
                        {t("Kept")}
                      </span>
                    ) : (
                      t("Keep this")
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenCategory(open ? null : group.category)}
                    aria-expanded={open}
                    className="h-10 rounded-pill border border-hairline bg-surface px-4 text-[13px]
                               font-semibold text-ink transition-colors hover:border-brand/45 hover:bg-wash"
                  >
                    {open ? t("Hide alternatives") : t("See alternatives")}
                  </button>
                </div>
              </div>

              {open && (
                <div className="border-t border-hairline bg-wash/40 p-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(["save", "recommended", "upgrade"] as const).map((band) => {
                      const option = group.options.find((o) => o.band === band);
                      if (!option) return null;
                      const active = chosen.id === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setProduct(group.category, option.id);
                            setOpenCategory(null);
                          }}
                          aria-pressed={active}
                          className={[
                            "rounded-xl border p-4 text-left transition-colors",
                            active
                              ? "border-brand bg-surface-raised"
                              : "border-hairline bg-surface-raised hover:border-brand/45",
                          ].join(" ")}
                        >
                          <span className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-body-soft">
                              {t(BAND_LABEL[band])}
                            </span>
                            {active && <Icon name="check" size={14} className="text-brand" />}
                          </span>
                          <span className="mt-1.5 block text-[14.5px] font-semibold text-ink">
                            {t(option.name)}
                          </span>
                          <span className="block text-[12.5px] text-body">{option.brand}</span>
                          <span className="mt-1.5 block text-[15px] font-semibold text-ink">
                            {formatInr(option.indicativePriceInr)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <p className="mt-6 max-w-2xl text-[12.5px] leading-relaxed text-body-soft">
        {t(
          "Prices are indicative planning figures for this prototype — not quotes, and not live. Confirm current pricing and availability with the retailer before ordering.",
        )}
      </p>
    </StudioShell>
  );
}
