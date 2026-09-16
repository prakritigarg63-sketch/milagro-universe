"use client";

import type { Project } from "@/lib/planner/types";
import { formatInr, areaSqft, inchesToFeetInchesShort } from "@/lib/planner/units";
import { groupMaterials, projectRange, formatLakh } from "./materials";
import { optionFor } from "./finishes";
import { describePlaced } from "./fixtures";

/**
 * The downloadable plan.
 *
 * A print-friendly HTML document opened in a new tab with the print dialog
 * ready, rather than a generated PDF. This project has no PDF toolchain, and a
 * button that does nothing is worse than one that hands the browser's own
 * "Save as PDF" the right document — which every modern browser offers from the
 * print dialog.
 *
 * Built as a standalone document with inline styles: it must survive being
 * saved, emailed and printed on a machine that has never seen this app.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string): string {
  return `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
}

const PROJECT_TYPE_LABEL: Record<string, string> = {
  newBuild: "New bathroom",
  renovation: "Renovation",
  redesign: "Redesign",
};

const STYLE_LABEL: Record<string, string> = {
  warmMinimal: "Warm Minimal",
  modernLuxe: "Modern Luxe",
  naturalEarthy: "Natural & Earthy",
  cleanContemporary: "Clean & Contemporary",
  classic: "Classic",
};

const TIER_LABEL: Record<string, string> = {
  budget: "Budget friendly",
  costEffective: "Smart value",
  goodQuality: "Premium",
  topOfLine: "Top of the line",
};

export function buildPrintableHtml(project: Project): string {
  const { room } = project;
  const estimate = project.estimate;
  const range = estimate ? projectRange(estimate.totalCostInr) : null;
  const groups = groupMaterials(estimate);
  const fixtures = project.placedFixtures ?? project.plan?.fixtures ?? [];

  const finishRows = (["floor", "walls", "vanity", "shower", "wc", "fittings", "lighting"] as const)
    .map((surface) => {
      const option = optionFor(surface, project.finishes?.[surface]);
      return option ? row(surface[0].toUpperCase() + surface.slice(1), option.label) : "";
    })
    .join("");

  const materialRows = groups
    .map(
      (group) => `
      <tr class="group"><th colspan="2" scope="colgroup">${escapeHtml(group.label)}</th></tr>
      ${group.lines
        .map(
          (line) =>
            `<tr><th scope="row">${escapeHtml(line.label)}</th><td>${line.quantity.toLocaleString("en-IN")} ${escapeHtml(line.unit)}${
              line.bufferPct ? ` <span class="muted">(+${Math.round(line.bufferPct * 100)}% buffer)</span>` : ""
            }</td></tr>`,
        )
        .join("")}`,
    )
    .join("");

  const fixtureRows = fixtures
    .map((f) =>
      row(
        describePlaced(f),
        `${Math.round(f.widthInches)} × ${Math.round(f.depthInches)} in`,
      ),
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(room.name)} — Milagro Universe plan</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 32px;
    font: 14px/1.55 -apple-system, "Segoe UI", system-ui, sans-serif;
    color: #102b4e; background: #fff;
    max-width: 820px; margin-inline: auto;
  }
  header { border-bottom: 2px solid #102b4e; padding-bottom: 16px; margin-bottom: 24px; }
  .brand { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #078cc8; font-weight: 700; }
  h1 { font-size: 26px; margin: 6px 0 2px; letter-spacing: -.01em; }
  .sub { color: #42566f; font-size: 13px; }
  h2 { font-size: 12px; letter-spacing: .09em; text-transform: uppercase; color: #6b7d94;
       margin: 26px 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 0; border-bottom: 1px solid #e3ebf2; font-weight: 400; vertical-align: top; }
  th[scope="row"] { color: #42566f; width: 52%; }
  td { text-align: right; font-weight: 600; }
  tr.group th { border-bottom: none; padding-top: 14px; font-size: 11px; letter-spacing: .08em;
                text-transform: uppercase; color: #078cc8; font-weight: 700; }
  .muted { color: #6b7d94; font-weight: 400; }
  .range { margin-top: 8px; padding: 16px; border: 1px solid #078cc8; border-radius: 12px; background: #f3fafe; }
  .range .big { font-size: 26px; font-weight: 700; letter-spacing: -.01em; }
  .note { margin-top: 26px; padding: 14px; border: 1px solid #e3ebf2; border-radius: 10px;
          background: #f8fbfd; color: #42566f; font-size: 12px; line-height: 1.6; }
  footer { margin-top: 26px; border-top: 1px solid #e3ebf2; padding-top: 12px;
           color: #6b7d94; font-size: 11px; display: flex; justify-content: space-between; gap: 12px; }
  @media print {
    body { padding: 0; }
    .range { break-inside: avoid; }
    h2 { break-after: avoid; }
  }
</style>
</head>
<body>
  <header>
    <div class="brand">Milagro Universe</div>
    <h1>${escapeHtml(room.name)}</h1>
    <div class="sub">${escapeHtml(PROJECT_TYPE_LABEL[project.projectType ?? ""] ?? "Bathroom plan")} · ${escapeHtml(
      new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    )}</div>
  </header>

  <h2>The space</h2>
  <table>
    ${row("Length", inchesToFeetInchesShort(room.lengthInches))}
    ${row("Width", inchesToFeetInchesShort(room.widthInches))}
    ${row("Height", inchesToFeetInchesShort(room.heightInches))}
    ${row("Floor area", `${areaSqft(room.lengthInches, room.widthInches)} sq ft`)}
    ${row("Door", `${room.door.widthInches} in on the ${room.door.wall} wall`)}
    ${project.plumbingIntent ? row("Existing plumbing", project.plumbingIntent === "keepExisting" ? "Keep where possible" : project.plumbingIntent === "openToMoving" ? "Open to moving" : "Undecided") : ""}
  </table>

  <h2>Layout &amp; fixtures</h2>
  <table>
    ${project.selectedLayoutId ? row("Layout", project.selectedLayoutId) : ""}
    ${fixtureRows || row("Fixtures", "None placed")}
  </table>

  ${finishRows ? `<h2>Style &amp; finishes</h2><table>${project.styleDirection ? row("Direction", STYLE_LABEL[project.styleDirection] ?? project.styleDirection) : ""}${finishRows}</table>` : ""}

  <h2>Materials</h2>
  <table>${materialRows || row("Materials", "Not yet calculated")}</table>

  <h2>Budget</h2>
  <table>
    ${row("Spending level", TIER_LABEL[project.style.costTier] ?? project.style.costTier)}
    ${project.style.budgetInr ? row("Your target", formatInr(project.style.budgetInr)) : ""}
    ${estimate ? row("Estimated materials", formatInr(estimate.materialCostInr)) : ""}
    ${estimate ? row(`Labour (${estimate.timeDays} days)`, formatInr(estimate.labourCostInr)) : ""}
  </table>

  ${
    range
      ? `<div class="range">
           <div class="brand">Estimated project range</div>
           <div class="big">${formatLakh(range.lowInr)} – ${formatLakh(range.highInr)}</div>
           <div class="sub">Planning estimate</div>
         </div>`
      : ""
  }

  <div class="note">
    <strong>Important:</strong> This is a planning document, not a construction drawing,
    a structural approval or a quote. Quantities are estimates and must be verified on
    site before purchase. Prices are indicative prototype figures, not live pricing.
    Labour, local rates and site conditions — existing plumbing, wall condition and
    access — will change the final amount. Have a qualified contractor confirm anything
    structural or related to plumbing and electrics before work begins.
  </div>

  <footer>
    <span>Milagro Universe — bathroom planning</span>
    <span>${escapeHtml(new Date().toLocaleString("en-IN"))}</span>
  </footer>
</body>
</html>`;
}

/**
 * Open the plan in a new tab, ready to print or save as PDF.
 * Returns false when the browser blocked the popup, so the caller can say so.
 */
export function openPrintablePlan(project: Project): boolean {
  const html = buildPrintableHtml(project);
  const tab = window.open("", "_blank", "noopener,noreferrer");
  if (!tab) return false;
  tab.document.open();
  tab.document.write(html);
  tab.document.close();
  // Let the document lay out before the print dialog measures it.
  tab.addEventListener("load", () => tab.print(), { once: true });
  return true;
}
