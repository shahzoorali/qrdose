import { createCanvas, loadImage, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import { PDFDocument } from "pdf-lib";
import path from "node:path";
import { qrDataUrl } from "./qrcode";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "./env";

const LOGO_PATH = path.join(process.cwd(), "public", "qrdose-logo.svg");

/**
 * A minimal production image (e.g. node:20-alpine, what this app ships in)
 * has no fonts installed at all, so @napi-rs/canvas has nothing to shape
 * text with — every fillText silently draws nothing, leaving only shapes
 * and images. Bundling and registering our own font makes text rendering
 * independent of whatever (if anything) the host has installed.
 */
const FONT_PATH = path.join(process.cwd(), "public", "fonts", "Inter-Variable.ttf");
const FONT_FAMILY = "QRdoseCardSans";
let fontRegistered = false;

function ensureFontRegistered(): void {
  if (fontRegistered) return;
  GlobalFonts.registerFromPath(FONT_PATH, FONT_FAMILY);
  fontRegistered = true;
}

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

// Matches public/qrdose-logo.svg exactly (capsule halves + wordmark fill).
const BRAND_BLUE = "#1B5288"; // id text, dividers
const BRAND_TEAL = "#3FB27F"; // border, teal copy
const DIVIDER = "#1B5288";
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
    ctx.font = `${weight} ${px}px ${FONT_FAMILY}`;
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  return `${weight} ${px}px ${FONT_FAMILY}`;
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
  ensureFontRegistered();
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

  // ── Logo (capsule + real QR + wordmark, as one asset) ────────────
  const logoImg = await loadImage(LOGO_PATH);
  const logoW = contentW * 0.86;
  const logoH = logoW * (logoImg.height / logoImg.width);
  const logoY = BORDER + 0.08 * DPI;
  ctx.drawImage(logoImg, cx - logoW / 2, logoY, logoW, logoH);

  // ── Subtitle ─────────────────────────────────────────────────────
  let y = logoY + logoH + 0.09 * DPI;
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
  ctx.font = `700 ${Math.round(0.095 * DPI)}px ${FONT_FAMILY}`;
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
