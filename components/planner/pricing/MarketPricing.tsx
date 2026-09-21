"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { formatInr } from "@/lib/planner/units";
import { plannerData } from "@/lib/planner/data";
import {
  brandTiersFor,
  fullEstimate,
  labourEstimate,
  snapToCity,
  type BrandTier,
} from "@/lib/planner/pricing";
import type { Project } from "@/lib/planner/types";
import type { CityKey, LabourTrade, Trade } from "@/lib/planner/data/types";

/**
 * Section B — researched market pricing, folded INTO the estimate screen (no new
 * journey steps). One brand per trade from the tiers the budget unlocks, a tile
 * look, a city for labour, and the all-in figure from the 2026 India retail
 * tables. Everything derives from the project + the tier; brands don't change the
 * price within a tier (demo), so this is who supplies it, not a second estimate.
 */

const TRADES: { id: Trade; label: string }[] = [
  { id: "sanitary", label: "Sanitaryware & fittings" },
  { id: "tiles", label: "Tiles & masonry" },
  { id: "electrical", label: "Electrical appliances" },
  { id: "wiring", label: "Switches & wires" },
];
const TIER_TAG: Record<BrandTier, string> = { t1: "Premium", t2: "Mid", t3: "Value" };
const COLOUR_LABEL: Record<string, string> = { white: "White", beige: "Beige", grey: "Grey", wood: "Wood", dark: "Dark" };
const TRADE_TOTAL_LABEL: Record<Trade, string> = {
  sanitary: "Sanitaryware & fittings",
  tiles: "Tiles & masonry",
  electrical: "Electrical",
  wiring: "Switches & wires",
};
const LABOUR_LABEL: Record<LabourTrade, string> = {
  plumber: "Plumber",
  electrician: "Electrician",
  tilerFloor: "Floor tiling",
  tilerWall: "Wall tiling",
  mason: "Mason",
};

type LocStatus = "idle" | "asking" | "denied";

export function MarketPricing({ project }: { project: Project }) {
  const t = useT();
  const setBrand = useProjectStore((s) => s.setBrand);
  const setTileLook = useProjectStore((s) => s.setTileLook);
  const setLocation = useProjectStore((s) => s.setLocation);

  const [open, setOpen] = useState(false);
  const [locStatus, setLocStatus] = useState<LocStatus>("idle");
  const [showChips, setShowChips] = useState(false);

  const tier = project.style.costTier;
  const brands = project.tradeBrands ?? { sanitary: null, tiles: null, electrical: null, wiring: null };
  const tileLook = project.tileLook ?? { colour: null, finish: null };
  const location = project.location ?? { lat: null, lng: null, city: null, source: null };
  const tiers = brandTiersFor(tier);

  const est = fullEstimate(project, plannerData);
  const labour = labourEstimate(project, plannerData);
  const cities = Object.entries(plannerData.cities) as [CityKey, (typeof plannerData.cities)[CityKey]][];
  const resolved = location.city ? plannerData.cities[location.city] : null;

  function offered(trade: Trade): { name: string; tier: BrandTier }[] {
    const set = plannerData.brands.byTrade[trade];
    const out: { name: string; tier: BrandTier }[] = [];
    for (const bt of tiers) for (const name of set[bt]) if (!out.some((o) => o.name === name)) out.push({ name, tier: bt });
    return out;
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocStatus("denied");
      setShowChips(true);
      return;
    }
    setLocStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng, city: snapToCity({ lat, lng }, plannerData.cities), source: "device" });
        setLocStatus("idle");
      },
      () => {
        setLocStatus("denied");
        setShowChips(true);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  function pickCity(city: CityKey) {
    const c = plannerData.cities[city];
    setLocation({ lat: c.lat, lng: c.lng, city, source: "chip" });
    setShowChips(false);
    setLocStatus("idle");
  }

  return (
    <section className="mt-8 rounded-2xl border border-hairline bg-surface-raised">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-5 text-left sm:p-6"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Icon name="wallet" size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15.5px] font-semibold text-ink">{t("Market pricing & brands")}</span>
          <span className="block text-[13px] text-body-soft">
            {t("Real 2026 prices, a brand per trade, and labour by city.")}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[15px] font-semibold text-ink tabular-nums">{formatInr(est.grandTotal)}</span>
          <span className="text-[11.5px] text-body-soft">{t("all-in")}</span>
        </span>
        <Icon name="chevronDown" size={18} className={`shrink-0 text-body-soft transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-hairline p-5 sm:p-6">
          {/* ── Brands per trade ──────────────────────────────────────── */}
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-body-soft">{t("Your brands")}</h3>
          <div className="mt-3 space-y-4">
            {TRADES.map((tr) => (
              <div key={tr.id}>
                <p className="text-[13px] font-medium text-body">{t(tr.label)}</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {offered(tr.id).map((opt) => {
                    const active = brands[tr.id] === opt.name;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setBrand(tr.id, opt.name)}
                        aria-pressed={active}
                        className={[
                          "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[13px] font-semibold transition-colors",
                          active ? "border-brand bg-brand/10 text-ink" : "border-hairline bg-surface text-body hover:border-brand/45 hover:text-ink",
                        ].join(" ")}
                      >
                        {active && <Icon name="check" size={13} className="text-brand" />}
                        {opt.name}
                        <span className="rounded-full bg-wash px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.04em] text-body-soft">
                          {t(TIER_TAG[opt.tier])}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* ── Tile look ─────────────────────────────────────────────── */}
          <h3 className="mt-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-body-soft">{t("Tile look")}</h3>
          <div className="mt-3 flex flex-wrap gap-3">
            {Object.entries(plannerData.tileLooks.colours).map(([key, { base }]) => {
              const active = tileLook.colour === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTileLook({ colour: key as typeof tileLook.colour })}
                  aria-pressed={active}
                  aria-label={t(COLOUR_LABEL[key] ?? key)}
                  className="flex flex-col items-center gap-1"
                >
                  <span className={`h-10 w-10 rounded-full border-2 ${active ? "border-brand scale-105" : "border-hairline"}`} style={{ backgroundColor: base }} />
                  <span className={active ? "text-[11.5px] font-semibold text-ink" : "text-[11.5px] text-body-soft"}>{t(COLOUR_LABEL[key] ?? key)}</span>
                </button>
              );
            })}
            <div className="ml-1 inline-flex self-start rounded-pill border border-hairline bg-surface p-0.5">
              {(["glossy", "matt"] as const).map((finish) => {
                const active = tileLook.finish === finish;
                return (
                  <button
                    key={finish}
                    type="button"
                    onClick={() => setTileLook({ finish })}
                    aria-pressed={active}
                    className={`rounded-pill px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${active ? "bg-brand text-on-brand" : "text-body hover:text-ink"}`}
                  >
                    {t(finish === "glossy" ? "Glossy" : "Matt")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Location & labour ─────────────────────────────────────── */}
          <h3 className="mt-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-body-soft">{t("City & labour")}</h3>
          <div className="mt-3">
            {resolved ? (
              <span className="inline-flex items-center gap-2 rounded-pill bg-brand/10 px-3 py-1.5 text-[13.5px] font-semibold text-ink">
                <Icon name="check" size={14} className="text-brand" />
                {t("Near")} {resolved.label}
                <button type="button" onClick={() => setShowChips((v) => !v)} className="ml-1 text-[12.5px] font-semibold text-brand hover:underline">
                  {t("Change")}
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locStatus === "asking"}
                className="inline-flex h-10 items-center gap-2 rounded-pill bg-clay px-4 text-[13.5px] font-semibold text-on-clay transition-colors hover:bg-clay-dark disabled:opacity-60"
              >
                <Icon name="search" size={15} />
                {locStatus === "asking" ? t("Finding your city…") : t("Use my location")}
              </button>
            )}
            {(showChips || (!resolved && locStatus === "denied")) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {cities.map(([key, c]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => pickCity(key)}
                    aria-pressed={location.city === key}
                    className={`rounded-pill border px-3 py-1.5 text-[13px] font-semibold transition-colors ${location.city === key ? "border-brand bg-brand/10 text-ink" : "border-hairline bg-surface text-body hover:border-brand/45 hover:text-ink"}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
            {resolved && labour.rows.length > 0 && (
              <dl className="mt-3 max-w-md">
                {labour.rows.map((r) => (
                  <div key={r.trade} className="flex items-baseline justify-between gap-4 border-b border-hairline py-2">
                    <dt className="text-[13.5px] text-ink">
                      {t(LABOUR_LABEL[r.trade])}
                      <span className="ml-1.5 text-[12px] text-body-soft">{r.qty} {r.unit} · {formatInr(r.rate)}/{r.unit}</span>
                    </dt>
                    <dd className="shrink-0 text-[13.5px] font-semibold text-ink tabular-nums">{formatInr(r.total)}</dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-4 py-2">
                  <dt className="text-[13.5px] font-semibold text-ink">{t("Labour subtotal")}</dt>
                  <dd className="shrink-0 text-[14px] font-semibold text-ink tabular-nums">{formatInr(labour.total)}</dd>
                </div>
              </dl>
            )}
          </div>

          {/* ── Researched all-in ─────────────────────────────────────── */}
          <h3 className="mt-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-body-soft">
            {t("Market estimate")} <span className="font-normal normal-case">· {t("researched 2026 prices")}</span>
          </h3>
          <dl className="mt-3 max-w-md">
            {est.material.sections.map((sec) => (
              <div key={sec.trade} className="flex items-baseline justify-between gap-4 border-b border-hairline py-2">
                <dt className="text-[13.5px] text-ink">
                  {t(TRADE_TOTAL_LABEL[sec.trade])}
                  {sec.brand && <span className="ml-1.5 text-[12px] text-body-soft">· {sec.brand}</span>}
                </dt>
                <dd className="shrink-0 text-[13.5px] font-semibold text-ink tabular-nums">{formatInr(sec.total)}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 py-2">
              <dt className="text-[13.5px] text-ink">
                {t("Labour")}
                {resolved && <span className="ml-1.5 text-[12px] text-body-soft">· {resolved.label}</span>}
              </dt>
              <dd className="shrink-0 text-[13.5px] font-semibold text-ink tabular-nums">
                {labour.total > 0 ? formatInr(labour.total) : t("set city")}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t-2 border-ink/15 py-3">
              <dt className="text-[15px] font-semibold text-ink">{t("Estimated total")}</dt>
              <dd className="shrink-0 text-right">
                <span className="block text-[18px] font-semibold text-ink tabular-nums">{formatInr(est.grandTotal)}</span>
                {est.perSqft > 0 && <span className="text-[12px] text-body-soft">≈ {formatInr(est.perSqft)} {t("per sq.ft")}</span>}
              </dd>
            </div>
          </dl>
          <p className="mt-2 max-w-md text-[12px] leading-relaxed text-body-soft">
            {t("Indicative 2026 retail estimates. Confirm with your contractor and dealer before purchase.")}
          </p>
        </div>
      )}
    </section>
  );
}
