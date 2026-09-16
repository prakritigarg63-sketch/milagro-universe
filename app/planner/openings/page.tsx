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
import { PlumbingIntentCard } from "@/components/planner/studio/PlumbingIntentCard";
import { wallLength } from "@/lib/planner/studio/geometry";
import { fromInches, parseLength, type LengthUnit } from "@/lib/planner/studio/measure";
import type { ExtraOpening, PlumbingPoint, PlumbingPointType, Wall } from "@/lib/planner/types";

type ArmKind = "door" | "window" | "vent" | PlumbingPointType;

const STRUCTURE: { kind: ArmKind; label: string; icon: Parameters<typeof Icon>[0]["name"] }[] = [
  { kind: "door", label: "Door", icon: "home" },
  { kind: "window", label: "Window", icon: "layers" },
  { kind: "vent", label: "Ventilation", icon: "swap" },
];

const PLUMBING: { kind: PlumbingPointType; label: string; icon: Parameters<typeof Icon>[0]["name"] }[] = [
  { kind: "wcOutlet", label: "WC outlet", icon: "toilet" },
  { kind: "basinPoint", label: "Basin point", icon: "sink" },
  { kind: "showerPoint", label: "Shower point", icon: "shower" },
  { kind: "waterInlet", label: "Water inlet", icon: "valve" },
];

const PLUMBING_LABEL: Record<PlumbingPointType, string> = {
  wcOutlet: "WC outlet",
  basinPoint: "Basin point",
  showerPoint: "Shower point",
  waterInlet: "Water inlet",
};

const WALL_LABEL: Record<Wall, string> = {
  back: "Back wall",
  front: "Front wall",
  left: "Left wall",
  right: "Right wall",
};

function newId(prefix: string): string {
  try {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  } catch {
    return `${prefix}-${Date.now().toString(36)}`;
  }
}

/**
 * Screen 3 — the fixed points.
 *
 * Everything here constrains the layouts we can suggest, which is why it comes
 * before the suggestions rather than after. Placement is click-to-wall: the
 * homeowner picks what to add, then taps roughly where it goes, and it snaps to
 * the nearest wall.
 */
export default function OpeningsPage() {
  const t = useT();
  const { project } = useEnsureProject();
  const setDoor = useProjectStore((s) => s.setDoor);
  const setNoWindow = useProjectStore((s) => s.setNoWindow);
  const addExtraOpening = useProjectStore((s) => s.addExtraOpening);
  const updateExtraOpening = useProjectStore((s) => s.updateExtraOpening);
  const removeExtraOpening = useProjectStore((s) => s.removeExtraOpening);
  const addPlumbingPoint = useProjectStore((s) => s.addPlumbingPoint);
  const removePlumbingPoint = useProjectStore((s) => s.removePlumbingPoint);

  const [arming, setArming] = useState<ArmKind | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unit] = useState<LengthUnit>("ft");

  const room = project?.room;
  const extras = project?.extraOpenings ?? [];
  const noWindow = project?.noWindow ?? false;
  const plumbing = project?.plumbing ?? [];
  const isRenovation = project?.projectType === "renovation";

  function place(hit: { wall: Wall; offset: number }) {
    if (!arming || !room) return;

    if (arming === "door") {
      setDoor({ ...room.door, wall: hit.wall, offsetInches: hit.offset });
      setSelectedId("door");
    } else if (arming === "window" || arming === "vent") {
      const opening: ExtraOpening = {
        id: newId(arming),
        kind: arming,
        wall: hit.wall,
        offsetInches: hit.offset,
        widthInches: arming === "window" ? 36 : 12,
        heightInches: arming === "window" ? 36 : 12,
        sillHeightInches: arming === "window" ? 42 : 84,
      };
      addExtraOpening(opening);
      setSelectedId(opening.id);
    } else {
      const point: PlumbingPoint = {
        id: newId(arming),
        type: arming,
        wall: hit.wall,
        offsetInches: hit.offset,
      };
      addPlumbingPoint(point);
      setSelectedId(point.id);
    }
    setArming(null);
  }

  const selectedExtra = extras.find((o) => o.id === selectedId) ?? null;
  const selectedPipe = plumbing.find((p) => p.id === selectedId) ?? null;

  return (
    <StudioShell stepId="openings" footer={<StepFooter stepId="openings" />}>
      <header className="max-w-2xl">
        <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[38px]">
          {t("Now tell us what can’t move.")}
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-body">
          {t(
            "Add doors, windows and existing plumbing so we can suggest layouts that actually work.",
          )}
        </p>
      </header>

      {isRenovation && <PlumbingIntentCard />}

      {room && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-10">
          {/* ── Palette ──────────────────────────────────────────────── */}
          <div>
            <PaletteGroup title={t("Structure")}>
              {STRUCTURE.map((item) => {
                const blocked = item.kind === "window" && noWindow;
                return (
                  <PaletteButton
                    key={item.kind}
                    icon={item.icon}
                    label={item.kind === "door" ? t("Move door") : `${t("Add")} ${t(item.label)}`}
                    armed={arming === item.kind && !blocked}
                    disabled={blocked}
                    onClick={() => {
                      if (blocked) return;
                      setArming(arming === item.kind ? null : item.kind);
                    }}
                  />
                );
              })}

              {/* Plenty of bathrooms have no window. Without somewhere to say
                  so, the only way to answer is to leave the step looking
                  unfinished and hope that reads as deliberate. */}
              <label className="mt-2 flex cursor-pointer items-start gap-2.5 rounded-xl border border-hairline bg-surface-raised p-3 text-left transition-colors hover:border-brand/40">
                <input
                  type="checkbox"
                  checked={noWindow}
                  onChange={(e) => {
                    setNoWindow(e.target.checked);
                    if (e.target.checked && arming === "window") setArming(null);
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
                />
                <span>
                  <span className="block text-[13.5px] font-medium text-ink">
                    {t("This bathroom has no window")}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-body-soft">
                    {t("We’ll plan for ventilation instead.")}
                  </span>
                </span>
              </label>
            </PaletteGroup>

            <PaletteGroup title={t("Plumbing")}>
              {PLUMBING.map((item) => (
                <PaletteButton
                  key={item.kind}
                  icon={item.icon}
                  label={`${t("Add")} ${t(item.label)}`}
                  armed={arming === item.kind}
                  onClick={() => setArming(arming === item.kind ? null : item.kind)}
                />
              ))}
            </PaletteGroup>

            {/* Placed items — the list is the accessible route to selection,
                for anyone not clicking pixels on an SVG. */}
            {(extras.length > 0 || plumbing.length > 0) && (
              <PaletteGroup title={t("Placed")}>
                {extras.map((o) => (
                  <PlacedRow
                    key={o.id}
                    label={`${t(o.kind === "vent" ? "Ventilation" : "Window")} — ${t(WALL_LABEL[o.wall])}`}
                    selected={selectedId === o.id}
                    onSelect={() => setSelectedId(o.id)}
                    onRemove={() => {
                      removeExtraOpening(o.id);
                      if (selectedId === o.id) setSelectedId(null);
                    }}
                    removeLabel={t("Remove")}
                  />
                ))}
                {plumbing.map((p) => (
                  <PlacedRow
                    key={p.id}
                    label={`${t(PLUMBING_LABEL[p.type])} — ${t(WALL_LABEL[p.wall])}`}
                    selected={selectedId === p.id}
                    onSelect={() => setSelectedId(p.id)}
                    onRemove={() => {
                      removePlumbingPoint(p.id);
                      if (selectedId === p.id) setSelectedId(null);
                    }}
                    removeLabel={t("Remove")}
                  />
                ))}
              </PaletteGroup>
            )}
          </div>

          {/* ── Plan + properties ────────────────────────────────────── */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-raised p-5 sm:p-7">
              {arming && (
                <p
                  role="status"
                  className="mb-4 flex items-center gap-2 rounded-xl bg-wash px-3.5 py-2.5 text-[13.5px] font-medium text-brand"
                >
                  <Icon name="plus" size={15} />
                  {t("Click anywhere on the plan — we’ll snap it to the nearest wall.")}
                </p>
              )}
              <RoomPlan
                room={room}
                unit={unit}
                doorDetail={project.doorDetail}
                extraOpenings={extras}
                plumbing={plumbing}
                onWallClick={arming ? place : undefined}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>

            {selectedId === "door" && (
              <DoorProperties unit={unit} onDeselect={() => setSelectedId(null)} />
            )}
            {selectedExtra && (
              <OpeningProperties
                opening={selectedExtra}
                unit={unit}
                maxOffset={wallLength(selectedExtra.wall, room)}
                onChange={(patch) => updateExtraOpening(selectedExtra.id, patch)}
                onDeselect={() => setSelectedId(null)}
              />
            )}
            {selectedPipe && (
              <div className="mt-4 rounded-2xl border border-hairline bg-surface-raised p-5">
                <PropertiesHeader
                  title={t(PLUMBING_LABEL[selectedPipe.type])}
                  subtitle={t(WALL_LABEL[selectedPipe.wall])}
                  onClose={() => setSelectedId(null)}
                />
                <p className="mt-3 text-[13px] text-body">
                  {t("Re-add it on another wall to move it.")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </StudioShell>
  );
}

function PaletteGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-body-soft">
        {title}
      </h2>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function PaletteButton({
  icon,
  label,
  armed,
  onClick,
  disabled = false,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  armed: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={armed}
      className={[
        "flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[14px] font-medium transition-colors",
        disabled
          ? "cursor-not-allowed border-hairline bg-surface-raised text-body-soft opacity-55"
          : armed
            ? "border-brand bg-wash text-brand"
            : "border-hairline bg-surface-raised text-ink hover:border-brand/45 hover:bg-wash",
      ].join(" ")}
    >
      <Icon name={icon} size={17} className={armed && !disabled ? "text-brand" : "text-body-soft"} />
      {label}
    </button>
  );
}

function PlacedRow({
  label,
  selected,
  onSelect,
  onRemove,
  removeLabel,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div
      className={[
        "flex items-center gap-1 rounded-xl border px-3 py-2 transition-colors",
        selected ? "border-brand bg-wash" : "border-hairline bg-surface-raised",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 truncate text-left text-[13.5px] text-ink"
      >
        {label}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${removeLabel} ${label}`}
        className="shrink-0 rounded-md p-1 text-body-soft transition-colors hover:bg-surface hover:text-danger"
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}

function PropertiesHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
        <p className="text-[12.5px] text-body-soft">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close properties"
        className="-m-1.5 rounded-md p-1.5 text-body-soft transition-colors hover:bg-wash hover:text-ink"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

/** Door width, hinge side and swing direction. */
function DoorProperties({ unit, onDeselect }: { unit: LengthUnit; onDeselect: () => void }) {
  const t = useT();
  const project = useProjectStore((s) => s.project);
  const setDoor = useProjectStore((s) => s.setDoor);
  const setDoorDetail = useProjectStore((s) => s.setDoorDetail);
  if (!project) return null;

  const door = project.room.door;
  const detail = project.doorDetail ?? { hinge: "left" as const, swing: "in" as const };

  return (
    <div className="mt-4 rounded-2xl border border-hairline bg-surface-raised p-5">
      <PropertiesHeader
        title={t("Door")}
        subtitle={t(WALL_LABEL[door.wall])}
        onClose={onDeselect}
      />
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <NumberField
          label={t("Width")}
          unit={unit}
          inches={door.widthInches}
          onCommit={(inches) => setDoor({ ...door, widthInches: Math.max(18, Math.round(inches)) })}
        />
        <Choice
          label={t("Hinge")}
          value={detail.hinge}
          options={[
            { value: "left", label: t("Left") },
            { value: "right", label: t("Right") },
          ]}
          onChange={(hinge) => setDoorDetail({ ...detail, hinge: hinge as "left" | "right" })}
        />
        <Choice
          label={t("Opens")}
          value={detail.swing}
          options={[
            { value: "in", label: t("Inward") },
            { value: "out", label: t("Outward") },
          ]}
          onChange={(swing) => setDoorDetail({ ...detail, swing: swing as "in" | "out" })}
        />
      </div>
      <p className="mt-3 text-[12.5px] text-body-soft">
        {t("An outward-opening door frees up floor space in a small bathroom.")}
      </p>
    </div>
  );
}

/** Window/vent width, height and sill height. */
function OpeningProperties({
  opening,
  unit,
  maxOffset,
  onChange,
  onDeselect,
}: {
  opening: ExtraOpening;
  unit: LengthUnit;
  maxOffset: number;
  onChange: (patch: Partial<ExtraOpening>) => void;
  onDeselect: () => void;
}) {
  const t = useT();
  const isWindow = opening.kind === "window";

  return (
    <div className="mt-4 rounded-2xl border border-hairline bg-surface-raised p-5">
      <PropertiesHeader
        title={t(isWindow ? "Window" : "Ventilation")}
        subtitle={t(WALL_LABEL[opening.wall])}
        onClose={onDeselect}
      />
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <NumberField
          label={t("Width")}
          unit={unit}
          inches={opening.widthInches}
          onCommit={(inches) => onChange({ widthInches: Math.max(6, Math.round(inches)) })}
        />
        <NumberField
          label={t("Height")}
          unit={unit}
          inches={opening.heightInches ?? 36}
          onCommit={(inches) => onChange({ heightInches: Math.max(6, Math.round(inches)) })}
        />
        <NumberField
          label={t("From floor")}
          unit={unit}
          inches={opening.sillHeightInches ?? 42}
          onCommit={(inches) => onChange({ sillHeightInches: Math.max(0, Math.round(inches)) })}
        />
      </div>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-[13px] font-medium text-body">
          {t("Position along wall")}
        </span>
        <input
          type="range"
          min={0}
          max={Math.round(maxOffset)}
          value={Math.round(opening.offsetInches)}
          onChange={(e) => onChange({ offsetInches: Number(e.target.value) })}
          className="w-full accent-[var(--color-brand)]"
          aria-label={t("Position along wall")}
        />
      </label>
    </div>
  );
}

function NumberField({
  label,
  unit,
  inches,
  onCommit,
}: {
  label: string;
  unit: LengthUnit;
  inches: number;
  onCommit: (inches: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <AffixInput
      label={label}
      suffix={unit}
      inputMode="decimal"
      value={draft ?? String(fromInches(inches, unit))}
      onValueChange={setDraft}
      onCommit={(raw) => {
        const parsed = parseLength(raw, unit);
        if (parsed !== null) onCommit(parsed);
        setDraft(null);
      }}
    />
  );
}

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-body">{label}</span>
      <div role="group" aria-label={label} className="flex rounded-xl border border-hairline bg-surface p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={[
              "flex-1 rounded-[10px] px-2 py-1.5 text-[13px] font-semibold transition-colors",
              value === option.value ? "bg-brand text-on-brand" : "text-body hover:text-ink",
            ].join(" ")}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
