import type { FinishSummaryRow } from "./summary";

/**
 * The shareable design card — the studio's 3D render turned into one downloadable
 * image a homeowner can send to family or a contractor.
 *
 * The drawing is a pure function of a 2D-context-like interface, so it can be
 * unit-tested with a recording fake; `composeShareCard` is the thin browser
 * wrapper that loads the render and hands back a PNG data URL.
 */

/** Portrait, sized for a phone share sheet / WhatsApp. */
export const CARD_W = 1080;
export const CARD_H = 1350;

/* A fixed, branded light palette — a shared image should look the same to
   everyone, regardless of the sender's or viewer's theme. */
const INK = "#102a43";
const BODY = "#4a5a68";
const SOFT = "#8797a4";
const BRAND = "#168aad";
const GROUND = "#faf8f4";
const PANEL = "#ffffff";
const HAIR = "#e7e1d7";

const P = 72;

export interface ShareCardText {
  /** Wordmark, e.g. "Milagro". */
  brand: string;
  /** Headline, translated, e.g. "Your bathroom design". */
  title: string;
  /** One line under the title, translated, e.g. "8 x 6 ft - 8 ft ceiling". */
  subtitle: string;
  /** Section heading, translated, e.g. "Finishes". */
  finishesLabel: string;
  /** Footer line, e.g. "milagro-universe.vercel.app". */
  footer: string;
  /** Rows with label/value already translated. */
  rows: FinishSummaryRow[];
}

/** Just the size we read off the render image — an HTMLImageElement satisfies it. */
export interface CardImage {
  width: number;
  height: number;
}

/** The slice of CanvasRenderingContext2D the card drawing actually uses. */
export interface CardCtx {
  save(): void;
  restore(): void;
  beginPath(): void;
  clip(): void;
  fill(): void;
  roundRect(x: number, y: number, w: number, h: number, r: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  drawImage(img: CardImage, dx: number, dy: number, dw: number, dh: number): void;
  fillStyle: string;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
}

const serif = (px: number, weight = "400") => `${weight} ${px}px "Marcellus", Georgia, serif`;
const sans = (px: number, weight = "400") => `${weight} ${px}px "Hanken Grotesk", system-ui, sans-serif`;

/** Draw `img` to cover the rounded region, centre-cropped. */
function coverImage(ctx: CardCtx, img: CardImage, x: number, y: number, w: number, h: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

/**
 * Paint the whole card. Pure: same inputs, same draw calls — no canvas, no DOM,
 * no i18n. The render is already captured; the text is already translated.
 */
export function drawShareCard(ctx: CardCtx, render: CardImage, text: ShareCardText) {
  // Ground.
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Header: wordmark + label.
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = serif(46);
  ctx.fillText(text.brand, P, 104);

  // Header rule.
  ctx.fillStyle = HAIR;
  ctx.fillRect(P, 132, CARD_W - 2 * P, 2);

  // The render, in a rounded panel.
  const rx = P;
  const ry = 166;
  const rw = CARD_W - 2 * P;
  const rh = 592;
  ctx.fillStyle = PANEL;
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, 28);
  ctx.fill();
  coverImage(ctx, render, rx, ry, rw, rh, 28);

  // Title + subtitle.
  ctx.fillStyle = INK;
  ctx.font = serif(42);
  ctx.fillText(text.title, P, 828);
  ctx.fillStyle = BODY;
  ctx.font = sans(24);
  ctx.fillText(text.subtitle, P, 866);

  // Finishes heading.
  ctx.fillStyle = SOFT;
  ctx.font = sans(20, "700");
  ctx.fillText(text.finishesLabel.toUpperCase(), P, 934);

  // Finishes, two columns.
  const colX = [P, CARD_W / 2 + 8];
  const startY = 968;
  text.rows.slice(0, 8).forEach((row, i) => {
    const x = colX[i % 2];
    const y = startY + Math.floor(i / 2) * 66;
    ctx.fillStyle = row.color;
    ctx.beginPath();
    ctx.roundRect(x, y, 34, 34, 9);
    ctx.fill();
    ctx.fillStyle = SOFT;
    ctx.font = sans(18, "600");
    ctx.fillText(row.label.toUpperCase(), x + 48, y + 13);
    ctx.fillStyle = INK;
    ctx.font = sans(25, "600");
    ctx.fillText(row.value, x + 48, y + 37);
  });

  // Footer.
  ctx.fillStyle = HAIR;
  ctx.fillRect(P, 1254, CARD_W - 2 * P, 2);
  ctx.textAlign = "center";
  ctx.fillStyle = BRAND;
  ctx.font = sans(23, "600");
  ctx.fillText(text.footer, CARD_W / 2, 1300);
  ctx.textAlign = "left";
}

/**
 * Compose the card in the browser and return a PNG data URL. Loads the captured
 * render, waits for the brand fonts so the canvas text is set in them, then draws.
 */
export async function composeShareCard(renderDataUrl: string, text: ShareCardText): Promise<string> {
  const img = await loadImage(renderDataUrl);

  // Best-effort: make sure the brand faces are ready before we paint text.
  try {
    await Promise.all([
      document.fonts.load(serif(46)),
      document.fonts.load(sans(25, "600")),
      document.fonts.ready,
    ]);
  } catch {
    /* fall back to the stack; the card still renders */
  }

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  drawShareCard(ctx as unknown as CardCtx, img, text);
  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("render image failed to load"));
    img.src = src;
  });
}
