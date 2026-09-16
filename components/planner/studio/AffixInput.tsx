"use client";

import { useId, type InputHTMLAttributes } from "react";

/**
 * A text input with a unit or currency sitting inside it.
 *
 * The border lives on the `<input>`, not on a wrapper, and the affixes are
 * positioned over it. That ordering matters: `app/globals.css` draws a focus
 * ring on `:focus-visible` for everything, deliberately and without exception.
 * If the box is drawn on a wrapper, that ring lands *inside* the box and
 * collides with the affix. With the border on the input, the ring sits neatly
 * outside the one box the user sees.
 *
 * Follows the same shape as `components/auth/fields.tsx` so inputs look the
 * same in the planner as they do at sign-in.
 */

/**
 * Left padding when a prefix is shown, in px.
 *
 * Fixed, not measured. Measuring meant a ref callback that set state on every
 * render; React detaches and reattaches refs each pass, so that thrashed the
 * input and could blur it mid-keystroke — which committed a half-typed number.
 * A constant is correct for the single-glyph prefixes this takes (₹, $, #) and
 * has no failure mode.
 */
const PREFIX_PAD = 36;

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "prefix"> {
  label: string;
  /** Visible label, or null to keep it screen-reader only. */
  showLabel?: boolean;
  value: string;
  /** Fires on every keystroke. */
  onValueChange: (value: string) => void;
  /** Fires on blur / Enter — where the value should be parsed and stored. */
  onCommit: (value: string) => void;
  /** A single glyph — see PREFIX_PAD. */
  prefix?: string;
  suffix?: string;
}

export function AffixInput({
  label,
  showLabel = true,
  value,
  onValueChange,
  onCommit,
  prefix,
  suffix,
  className = "",
  ...rest
}: Props) {
  const id = useId();

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={
          showLabel
            ? "mb-1.5 block text-[13px] font-medium text-body"
            : "sr-only"
        }
      >
        {label}
      </label>

      <div className="relative">
        {prefix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[14.5px] text-body-soft"
          >
            {prefix}
          </span>
        )}

        <input
          id={id}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onBlur={(e) => onCommit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          /* The radius is inline, not a utility, and that is deliberate:
             globals.css forces border-radius:4px on :focus-visible so the global
             focus ring hugs small controls. On a 12px field that squares the
             corners the instant you click in. An inline value wins in every
             state without weakening the accessibility rule for everything else. */
          style={{ borderRadius: 12, ...(prefix ? { paddingLeft: PREFIX_PAD } : {}) }}
          className={[
            "h-12 w-full border border-hairline bg-surface px-3.5 text-[14.5px] font-semibold text-ink",
            "placeholder:font-normal placeholder:text-body-soft/70",
            "transition-[border-color,box-shadow] duration-200",
            "focus:border-brand focus:ring-4 focus:ring-brand/12",
            suffix ? "pr-12" : "",
          ].join(" ")}
          {...rest}
        />

        {suffix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[13px] text-body-soft"
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
