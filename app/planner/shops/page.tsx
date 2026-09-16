"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { StudioShell } from "@/components/planner/studio/StudioShell";
import { StepFooter } from "@/components/planner/studio/StepFooter";
import { procurementData } from "@/lib/planner/data";
import {
  dealersFor,
  mapsUrl,
  snapToCity,
  type DealerGroup,
  type GroupKey,
  type ResolvedLocation,
} from "@/lib/planner/procurement/dealers";
import type { CityKey, DealerAuth } from "@/lib/planner/data/types";

/**
 * Section D — where to buy, near you.
 *
 * Real, researched dealers grouped by trade for the customer's city, with Call
 * and Maps links. Self-contained: it captures the city itself (device location,
 * or a chip) rather than depending on an earlier pricing step.
 */

const GROUP_LABEL: Record<GroupKey, string> = {
  sanitary: "Sanitaryware & fittings",
  tiles: "Tiles & masonry",
  electrical: "Electrical appliances",
  wiring: "Switches & wires",
};

const AUTH_LABEL: Record<DealerAuth, string> = {
  "brand-owned": "Brand store",
  authorised: "Authorised",
  "multi-brand": "Multi-brand",
};

const NOTE_TEXT: Record<DealerGroup["note"], string> = {
  within5: "Within 5 km",
  widened15: "Nearest within 15 km",
  cityOnly: "Across the city",
  chipCity: "Across the city",
  empty: "",
};

type Status = "idle" | "asking" | "denied";

export default function ShopsPage() {
  const t = useT();
  const router = useRouter();

  const [loc, setLoc] = useState<ResolvedLocation | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [showChips, setShowChips] = useState(false);

  const cities = Object.entries(procurementData.cities) as [CityKey, (typeof procurementData.cities)[CityKey]][];
  const result = loc ? dealersFor(loc, procurementData) : null;
  const cityLabel = loc ? procurementData.cities[loc.city].label : null;

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("denied");
      setShowChips(true);
      return;
    }
    setStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLoc({ city: snapToCity({ lat, lng }, procurementData.cities), source: "device", lat, lng });
        setStatus("idle");
      },
      () => {
        setStatus("denied");
        setShowChips(true);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  function pickCity(city: CityKey) {
    setLoc({ city, source: "chip" });
    setShowChips(false);
    setStatus("idle");
  }

  return (
    <StudioShell
      stepId="shops"
      footer={
        <StepFooter
          stepId="shops"
          continueLabel={t("Done")}
          continueOverride={() => router.push("/bathrooms")}
        />
      }
    >
      <header className="max-w-2xl">
        <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[38px]">
          {t("Shops near you")}
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-body">
          {t("Real, listed dealers for your bathroom, grouped by trade. Call ahead before visiting.")}
        </p>
      </header>

      {/* ── Location ────────────────────────────────────────────────────── */}
      <section className="mt-8 max-w-xl rounded-2xl border border-hairline bg-surface-raised p-5 sm:p-6">
        {cityLabel ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-pill bg-brand/10 px-3.5 py-2 text-[14px] font-semibold text-ink">
              <Icon name="check" size={15} className="text-brand" />
              {t("Near")} {cityLabel}
              {loc?.source === "chip" && (
                <span className="text-[12px] font-normal text-body-soft">· {t("approximate")}</span>
              )}
            </span>
            <button type="button" onClick={() => setShowChips((v) => !v)} className="text-[13.5px] font-semibold text-brand hover:underline">
              {t("Change location")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={useMyLocation}
            disabled={status === "asking"}
            className="inline-flex h-11 items-center gap-2 rounded-pill bg-clay px-5 text-sm font-semibold text-on-clay shadow-[0_6px_18px_rgb(154_106_67/0.30)] transition-[transform,background-color] duration-200 hover:-translate-y-px hover:bg-clay-dark disabled:opacity-60 motion-reduce:hover:translate-y-0"
          >
            <Icon name="search" size={16} />
            {status === "asking" ? t("Finding your city…") : t("Use my location")}
          </button>
        )}

        {status === "denied" && !cityLabel && (
          <p className="mt-3 text-[12.5px] text-body-soft" role="status">
            {t("Location unavailable — pick your city")}
          </p>
        )}

        {(showChips || (!cityLabel && status === "denied")) && (
          <div className="mt-4 flex flex-wrap gap-2.5">
            {cities.map(([key, c]) => {
              const active = loc?.city === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => pickCity(key)}
                  aria-pressed={active}
                  className={[
                    "rounded-pill border px-3.5 py-2 text-[13.5px] font-semibold transition-colors",
                    active ? "border-brand bg-brand/10 text-ink" : "border-hairline bg-surface text-body hover:border-brand/45 hover:text-ink",
                  ].join(" ")}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Dealer groups ───────────────────────────────────────────────── */}
      {result && (
        <div className="mt-8 space-y-8">
          {result.groups.map((group) => (
            <section key={group.key}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[17px] font-semibold text-ink">{t(GROUP_LABEL[group.key])}</h2>
                {group.dealers.length > 0 && (
                  <span className="text-[12.5px] text-body-soft">
                    {group.dealers.length} · {t(NOTE_TEXT[group.note])}
                  </span>
                )}
              </div>

              {group.dealers.length === 0 ? (
                <p className="mt-2 text-[13.5px] text-body-soft">{t("No listed dealer in your city yet.")}</p>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {group.dealers.slice(0, 8).map((d, i) => (
                    <article key={`${d.name}-${i}`} className="flex flex-col rounded-2xl border border-hairline bg-surface-raised p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[14.5px] font-semibold leading-snug text-ink">{d.name}</h3>
                        <span className="shrink-0 rounded-full bg-wash px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-body-soft">
                          {t(AUTH_LABEL[d.auth])}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-body">{d.addr}</p>
                      <div className="mt-2 flex items-center gap-3 text-[12px] text-body-soft">
                        <span className="font-semibold text-body">{d.brand}</span>
                        {d.distKm !== undefined && <span>· {d.distKm.toFixed(1)} km</span>}
                      </div>
                      <div className="mt-3 flex gap-2">
                        {d.phone ? (
                          <a
                            href={`tel:${d.phone}`}
                            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-pill border border-hairline text-[12.5px] font-semibold text-ink transition-colors hover:bg-wash"
                          >
                            <Icon name="user" size={13} /> {t("Call")}
                          </a>
                        ) : (
                          <span className="inline-flex h-9 flex-1 items-center justify-center rounded-pill border border-hairline text-[12px] text-body-soft">
                            {t("No phone listed")}
                          </span>
                        )}
                        <a
                          href={mapsUrl(d)}
                          target="_blank"
                          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-pill bg-brand text-[12.5px] font-semibold text-on-brand transition-colors hover:bg-brand/90"
                        >
                          <Icon name="search" size={13} /> {t("Map")}
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}

          <p className="text-[12px] leading-relaxed text-body-soft">
            {t("Listings from public sources, collected Sept 2026. Call before visiting.")}
          </p>
        </div>
      )}
    </StudioShell>
  );
}
