import { createCanvas, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import { PDFDocument } from "pdf-lib";
import { qrDataUrl } from "./qrcode";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "./env";

/**
 * Physical card: CR80 stock printed in portrait, 2.125in wide x 3.375in tall,
 * matching the existing printed QRdose card. Rendered at 300dpi so the PNG
 * and PDF are print-ready without upscaling.
 */
const DPI = 300;
const CARD_W_IN = 2.125;
const CARD_H_IN = 3.375;
const W = Math.round(CARD_W_IN * DPI); // 637px
const H = Math.round(CARD_H_IN * DPI); // 1012px

const BRAND_BLUE = "#1a4f9c"; // wordmark, capsule left half, id text
const BRAND_TEAL = "#35a093"; // border, capsule right half, teal copy
const DIVIDER = "#2a5ca8";
const BORDER = Math.round(0.11 * DPI); // ~33px frame, ~5% of card width

function roundRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Shrink `size` until `text` fits `maxWidth`, then return the font string. */
function fitFont(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
  size: number,
  weight = 700
): string {
  let px = size;
  for (; px > 8; px--) {
    ctx.font = `${weight} ${px}px sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  return `${weight} ${px}px sans-serif`;
}

/** Center-wrap text within maxWidth, one word at a time, top-anchored at y. */
function wrapText(
  ctx: SKRSContext2D,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lineHeight));
}

/** The small white QR glyph sitting inside the capsule's blue half. */
function drawQrGlyph(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  const modules = 7;
  const m = size / modules;
  const grid: number[][] = Array.from({ length: modules }, () =>
    Array(modules).fill(0)
  );
  // Finder squares at three corners, as on a real QR code.
  const finders = [
    [0, 0],
    [4, 0],
    [0, 4],
  ];
  for (const [fx, fy] of finders) {
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        // Hollow centre, like a finder pattern's ring.
        grid[fy + dy][fx + dx] = dx === 1 && dy === 1 ? 0 : 1;
      }
    }
  }
  // A handful of data modules so it reads as a code, not a logo.
  for (const [dx, dy] of [
    [4, 4],
    [6, 4],
    [5, 5],
    [4, 6],
    [6, 6],
    [3, 3],
    [3, 1],
    [1, 3],
  ]) {
    grid[dy][dx] = 1;
  }

  ctx.fillStyle = color;
  for (let gy = 0; gy < modules; gy++) {
    for (let gx = 0; gx < modules; gx++) {
      if (grid[gy][gx]) ctx.fillRect(x + gx * m, y + gy * m, m * 1.02, m * 1.02);
    }
  }
}

/** The NFC "tap" arcs printed beside the card id. */
function drawNfcArcs(ctx: SKRSContext2D, x: number, y: number, scale: number) {
  ctx.strokeStyle = "#111827";
  ctx.lineCap = "round";
  for (let i = 1; i <= 3; i++) {
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.arc(x, y, i * 11 * scale, -Math.PI / 3.2, Math.PI / 3.2);
    ctx.stroke();
  }
}

/**
 * Draw the card face onto a fresh canvas and return it as a PNG buffer.
 *
 * Single centred column, top to bottom: capsule logomark, QRdose wordmark,
 * network subtitle, rule, scan instruction, the QR code as the visual
 * anchor, the card id in a bordered box beside the NFC arcs, and the
 * support footer — the layout of the printed card.
 */
async function renderCardPng(cardId: string): Promise<Buffer> {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Teal frame, white face.
  roundRect(ctx, 0, 0, W, H, 0.14 * DPI);
  ctx.fillStyle = BRAND_TEAL;
  ctx.fill();
  roundRect(ctx, BORDER, BORDER, W - BORDER * 2, H - BORDER * 2, 0.09 * DPI);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const cx = W / 2;
  const pad = BORDER + 0.09 * DPI;
  const contentW = W - pad * 2;

  // ── Capsule logomark ─────────────────────────────────────────────
  const pillW = contentW * 0.52;
  const pillH = pillW * 0.39;
  const pillX = cx - pillW / 2;
  const pillY = BORDER + 0.055 * DPI;

  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = BRAND_TEAL;
  ctx.fill();
  // Blue left half, clipped to the capsule so the rounded end is kept.
  ctx.save();
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.clip();
  ctx.fillStyle = BRAND_BLUE;
  ctx.fillRect(pillX, pillY, pillW * 0.52, pillH);
  ctx.restore();

  const glyph = pillH * 0.62;
  drawQrGlyph(
    ctx,
    pillX + pillW * 0.26 - glyph / 2,
    pillY + pillH / 2 - glyph / 2,
    glyph,
    "#ffffff"
  );

  // ── Wordmark ─────────────────────────────────────────────────────
  let y = pillY + pillH + 0.20 * DPI;
  ctx.fillStyle = BRAND_BLUE;
  ctx.font = fitFont(ctx, "QRdose", contentW, Math.round(0.30 * DPI), 800);
  ctx.fillText("QRdose", cx, y);

  // ── Subtitle ─────────────────────────────────────────────────────
  y += 0.235 * DPI;
  ctx.fillStyle = BRAND_TEAL;
  ctx.font = fitFont(
    ctx,
    "MEDICATION ALERT NETWORK",
    contentW,
    Math.round(0.107 * DPI)
  );
  ctx.fillText("MEDICATION ALERT NETWORK", cx, y);

  // ── Rule ─────────────────────────────────────────────────────────
  y += 0.10 * DPI;
  ctx.strokeStyle = DIVIDER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(W - pad, y);
  ctx.stroke();

  // ── Scan instruction ─────────────────────────────────────────────
  y += 0.117 * DPI;
  ctx.fillStyle = BRAND_TEAL;
  ctx.font = `700 ${Math.round(0.095 * DPI)}px sans-serif`;
  wrapText(
    ctx,
    "USE ANY SMART PHONE TO SCAN THE QR CODE OR TAP",
    cx,
    y,
    contentW,
    0.12 * DPI
  );

  // ── QR code: the anchor of the card ──────────────────────────────
  const qrSize = contentW * 0.91;
  const qrY = y + 0.183 * DPI;
  const qrImg = await loadImage(await qrDataUrl(cardId));
  ctx.drawImage(qrImg, cx - qrSize / 2, qrY, qrSize, qrSize);

  // ── Card id box + NFC arcs ───────────────────────────────────────
  const boxH = 0.185 * DPI;
  const boxW = contentW * 0.8;
  const boxX = pad;
  const boxY = qrY + qrSize + 0.033 * DPI;
  ctx.strokeStyle = DIVIDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.fillStyle = BRAND_BLUE;
  ctx.font = fitFont(
    ctx,
    `ID: ${cardId}`,
    boxW - 0.08 * DPI,
    Math.round(0.095 * DPI),
    600
  );
  ctx.fillText(`ID: ${cardId}`, boxX + boxW / 2, boxY + boxH / 2);

  drawNfcArcs(
    ctx,
    boxX + boxW + (contentW - boxW) * 0.35,
    boxY + boxH / 2,
    DPI / 300
  );

  // ── Support footer ───────────────────────────────────────────────
  const footer = SUPPORT_PHONE
    ? `CONTACT US: ${SUPPORT_EMAIL} OR ${SUPPORT_PHONE}`
    : `CONTACT US: ${SUPPORT_EMAIL}`;
  ctx.fillStyle = BRAND_TEAL;
  ctx.font = fitFont(ctx, footer, W - BORDER * 2 - 0.06 * DPI, Math.round(0.08 * DPI));
  ctx.fillText(footer, cx, H - BORDER - 0.035 * DPI);

  return canvas.toBuffer("image/png");
}

/** PNG preview of the printable card, at 300dpi. */
export async function cardPngBuffer(cardId: string): Promise<Buffer> {
  return renderCardPng(cardId);
}

/**
 * Print-ready PDF: a single page sized exactly 2.125in x 3.375in (no bleed),
 * the card face filling the full page so it prints at 1:1 scale.
 */
export async function cardPdfBuffer(cardId: string): Promise<Buffer> {
  const png = await renderCardPng(cardId);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([CARD_W_IN * 72, CARD_H_IN * 72]);
  const image = await pdf.embedPng(png);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: CARD_W_IN * 72,
    height: CARD_H_IN * 72,
  });
  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
