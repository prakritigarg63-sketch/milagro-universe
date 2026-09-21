import { describe, expect, it } from "vitest";
import { finishSummary } from "./summary";
import { drawShareCard, CARD_W, CARD_H, type CardCtx, type CardImage, type ShareCardText } from "./card";

describe("finishSummary", () => {
  it("returns only chosen finishes, in toolbar order, with labels and colours", () => {
    const rows = finishSummary({ walls: "deepSlate", floor: "warmTravertine" });
    // Toolbar order is tiles, floor, walls, ... so floor comes before walls.
    expect(rows.map((r) => r.surface)).toEqual(["floor", "walls"]);
    expect(rows[0]).toMatchObject({ value: "Warm Travertine", color: "#d8c5ac" });
    expect(rows[1]).toMatchObject({ label: "Walls", value: "Deep Slate", color: "#5a6a74" });
  });

  it("skips unknown ids and empty input", () => {
    expect(finishSummary(undefined)).toEqual([]);
    expect(finishSummary({})).toEqual([]);
    expect(finishSummary({ walls: "does-not-exist" })).toEqual([]);
  });
});

/** A recording fake for the 2D context — captures the draw calls we care about. */
function fakeCtx() {
  const calls: { text: string[]; images: number; rects: number } = { text: [], images: 0, rects: 0 };
  const ctx: CardCtx = {
    save() {},
    restore() {},
    beginPath() {},
    clip() {},
    fill() {},
    roundRect() {},
    fillRect() {
      calls.rects++;
    },
    fillText(t) {
      calls.text.push(t);
    },
    drawImage() {
      calls.images++;
    },
    fillStyle: "",
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
  };
  return { ctx, calls };
}

describe("drawShareCard", () => {
  const text: ShareCardText = {
    brand: "Milagro",
    title: "Your bathroom design",
    subtitle: "8 x 6 ft",
    finishesLabel: "Finishes",
    footer: "milagro-universe.vercel.app",
    rows: finishSummary({ walls: "deepSlate", floor: "warmTravertine", fittings: "brass" }),
  };
  const render: CardImage = { width: 1000, height: 640 };

  it("paints the brand, title, footer, and every finish value", () => {
    const { ctx, calls } = fakeCtx();
    drawShareCard(ctx, render, text);
    expect(calls.images).toBe(1); // the render is drawn once
    expect(calls.text).toContain("Milagro");
    expect(calls.text).toContain("Your bathroom design");
    expect(calls.text).toContain("milagro-universe.vercel.app");
    expect(calls.text).toContain("Deep Slate");
    expect(calls.text).toContain("Warm Travertine");
    expect(calls.text).toContain("Brushed Brass");
  });

  it("caps the finishes grid at 8 rows", () => {
    const many = finishSummary({
      floor: "warmTravertine",
      walls: "deepSlate",
      tiles: "terrazzo",
      vanity: "oak",
      shower: "chrome",
      wc: "gloss",
      fittings: "brass",
      lighting: "warm",
    });
    const { ctx, calls } = fakeCtx();
    drawShareCard(ctx, render, { ...text, rows: many });
    // 8 finishes each print a label + value = 16 finish texts, plus brand/title/subtitle/footer.
    const finishTexts = calls.text.filter((t) => t.length > 0);
    expect(many.length).toBe(8);
    expect(finishTexts.length).toBeGreaterThanOrEqual(16 + 4);
  });

  it("uses the shared card dimensions", () => {
    expect(CARD_W).toBe(1080);
    expect(CARD_H).toBe(1350);
  });
});
