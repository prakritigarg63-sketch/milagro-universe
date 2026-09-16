"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { useProjectStore } from "@/lib/planner/store/project-store";
import { useEnsureProject } from "@/lib/planner/store/use-ensure-project";
import { StudioShell } from "@/components/planner/studio/StudioShell";
import { StepFooter } from "@/components/planner/studio/StepFooter";
import { RoomPlan } from "@/components/planner/studio/RoomPlan";
import { AffixInput } from "@/components/planner/studio/AffixInput";
import { DIM_BOUNDS } from "@/lib/planner/defaults";
import {
  LENGTH_UNITS,
  formatArea,
  fromInches,
  parseLength,
  type LengthUnit,
} from "@/lib/planner/studio/measure";

type DimKey = "length" | "width" | "height";

const DIMS: { key: DimKey; label: string; field: "lengthInches" | "widthInches" | "heightInches" }[] = [
  { key: "length", label: "Length", field: "lengthInches" },
  { key: "width", label: "Width", field: "widthInches" },
  { key: "height", label: "Height", field: "heightInches" },
];

/**
 * Screen 2 — the dimensions.
 *
 * Three numbers and a picture that answers them immediately. The drawing is the
 * point: a homeowner who mistypes 8 ft as 80 sees a corridor appear, which is a
 * faster correction than any validation message.
 */
export default function MeasurePage() {
  const t = useT();
  const { project } = useEnsureProject();
  const setDim = useProjectStore((s) => s.setDim);
  const [unit, setUnit] = useState<LengthUnit>("ft");
  const [shape, setShape] = useState<"simple" | "custom">("simple");

  const room = project?.room;

  return (
    <StudioShell stepId="measure" footer={<StepFooter stepId="measure" />}>
      <header className="max-w-2xl">
        <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[38px]">
          {t("Let’s get the dimensions right.")}
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-body">
          {t("A few measurements are enough to start building your bathroom plan.")}
        </p>
      </header>

      {room && (
        <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] lg:gap-10">
          {/* ── Controls ─────────────────────────────────────────────── */}
          <div>
            <div className="flex items-baseline justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-body-soft">
                {t("Bathroom dimensions")}
              </h2>
              <UnitPicker unit={unit} onChange={setUnit} t={t} />
            </div>

            <div className="mt-4 space-y-3">
              {DIMS.map((dim) => (
                <DimensionField
                  key={dim.key}
                  label={t(dim.label)}
                  unit={unit}
                  inches={room[dim.field]}
                  bounds={DIM_BOUNDS[dim.key]}
                  onCommit={(inches) => setDim(dim.key, inches)}
                />
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-hairline bg-wash px-4 py-3">
              <div className="flex items-center justify-between text-[13.5px]">
                <span className="text-body">{t("Floor area")}</span>
                <span className="font-semibold text-ink">
                  {formatArea(room.lengthInches, room.widthInches, unit)}
                </span>
              </div>
            </div>

            {/* ── Shape ──────────────────────────────────────────────── */}
            <h2 className="mt-8 text-[13px] font-semibold uppercase tracking-[0.08em] text-body-soft">
              {t("Room shape")}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ShapeOption
                active={shape === "simple"}
                onClick={() => setShape("simple")}
                title={t("Simple room")}
                hint={t("Four straight walls")}
              />
              <ShapeOption
                active={shape === "custom"}
                onClick={() => setShape("custom")}
                title={t("Custom shape")}
                hint={t("Alcoves, angles")}
              />
            </div>
            {shape === "custom" && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-hairline bg-surface-raised px-3.5 py-3 text-[13px] leading-relaxed text-body">
                <Icon name="warning" size={15} className="mt-px shrink-0 text-body-soft" />
                {t(
                  "Custom shapes are coming. For now we’ll plan the rectangle that fits your space — you can adjust walls later.",
                )}
              </p>
            )}
          </div>

          {/* ── Live plan ────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-raised p-5 sm:p-7">
              <RoomPlan
                room={room}
                unit={unit}
                doorDetail={project.doorDetail}
                ariaLabel={t("Live plan of your bathroom, updating as you type")}
              />
            </div>
            <p className="mt-3 text-center text-[12.5px] text-body-soft">
              {t("Measured wall to wall, inside the finished surfaces.")}
            </p>
          </div>
        </div>
      )}
    </StudioShell>
  );
}

function UnitPicker({
  unit,
  onChange,
  t,
}: {
  unit: LengthUnit;
  onChange: (u: LengthUnit) => void;
  t: (s: string) => string;
}) {
  return (
    <div
      role="group"
      aria-label={t("Measurement unit")}
      className="inline-flex rounded-pill border border-hairline bg-surface-raised p-0.5"
    >
      {LENGTH_UNITS.map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          aria-pressed={unit === u}
          className={[
            "min-w-[34px] rounded-pill px-2 py-1 text-[12px] font-semibold transition-colors",
            unit === u ? "bg-brand text-on-brand" : "text-body hover:text-ink",
          ].join(" ")}
        >
          {u}
        </button>
      ))}
    </div>
  );
}

/**
 * One dimension. Typed entry is the primary path; the steppers exist because
 * nudging a wall by six inches is a common, fiddly thing to type.
 */
function DimensionField({
  label,
  unit,
  inches,
  bounds,
  onCommit,
}: {
  label: string;
  unit: LengthUnit;
  inches: number;
  bounds: { min: number; max: number; step: number };
  onCommit: (inches: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(fromInches(inches, unit));
  const atMin = inches <= bounds.min;
  const atMax = inches >= bounds.max;

  function commit(raw: string) {
    const parsed = parseLength(raw, unit);
    if (parsed !== null) onCommit(parsed);
    setDraft(null);
  }

  return (
    <div>
      <span className="mb-1 block text-[13px] font-medium text-body">{label}</span>
      <div className="flex items-end gap-2">
      <AffixInput
        className="flex-1"
        label={`${label} in ${unit}`}
        showLabel={false}
        suffix={unit}
        inputMode="decimal"
        value={shown}
        onValueChange={setDraft}
        onCommit={commit}
      />

      <div className="flex flex-col gap-1">
        <StepButton
          label={`Increase ${label}`}
          disabled={atMax}
          onClick={() => onCommit(Math.min(bounds.max, inches + bounds.step))}
        >
          <Icon name="arrowDown" size={13} className="rotate-180" />
        </StepButton>
        <StepButton
          label={`Decrease ${label}`}
          disabled={atMin}
          onClick={() => onCommit(Math.max(bounds.min, inches - bounds.step))}
        >
          <Icon name="arrowDown" size={13} />
        </StepButton>
        </div>
      </div>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-[22px] w-8 items-center justify-center rounded-md border border-hairline
                 bg-surface-raised text-body transition-colors hover:border-brand hover:text-brand
                 disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ShapeOption({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-xl border px-3.5 py-3 text-left transition-colors",
        active
          ? "border-brand bg-wash"
          : "border-hairline bg-surface-raised hover:border-brand/45",
      ].join(" ")}
    >
      <span className="block text-[14px] font-semibold text-ink">{title}</span>
      <span className="mt-0.5 block text-[12.5px] text-body-soft">{hint}</span>
    </button>
  );
}
