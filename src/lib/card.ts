import { createCanvas, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import { PDFDocument } from "pdf-lib";
import { qrDataUrl } from "./qrcode";

/**
 * Physical card dimensions: standard CR80 size, 3.375in x 2.125in.
 * Rendered at 300dpi so the PNG/PDF are print-ready without upscaling.
 */
const DPI = 300;
const CARD_W_IN = 3.375;
const CARD_H_IN = 2.125;
const W = Math.round(CARD_W_IN * DPI); // 1012px
const H = Math.round(CARD_H_IN * DPI); // 637px

const BRAND_NAVY = "#1e3a5f";
const BRAND_TEAL = "#2f9e8f";
const BORDER = Math.round(0.12 * DPI); // ~36px teal border, matches sample

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

/**
 * Draw the full card face onto a fresh canvas and return it as a PNG buffer.
 *
 * Laid out in two columns to fit the standard CR80 landscape proportions
 * (3.375in x 2.125in) — QR + card id on the left, wordmark and instructions
 * on the right — rather than stacking everything vertically, which the
 * short card height can't hold.
 */
async function renderCardPng(cardId: string): Promise<Buffer> {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const radius = Math.round(0.12 * DPI);

  // Teal border, white face.
  roundRect(ctx, 0, 0, W, H, radius);
  ctx.fillStyle = BRAND_TEAL;
  ctx.fill();
  roundRect(ctx, BORDER, BORDER, W - BORDER * 2, H - BORDER * 2, radius * 0.6);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const innerX = BORDER + 0.1 * DPI;
  const innerY = BORDER + 0.08 * DPI;
  const innerW = W - 2 * (BORDER + 0.1 * DPI);
  const innerH = H - 2 * (BORDER + 0.08 * DPI);

  const leftW = innerW * 0.36;
  const leftCx = innerX + leftW / 2;
  const rightX = innerX + leftW + 0.12 * DPI;
  const rightCx = rightX + (innerW - leftW - 0.12 * DPI) / 2;

  // ── Left column: QR code + card id ──────────────────────────────
  const qrSize = leftW * 0.92;
  const qrUrl = await qrDataUrl(cardId);
  const qrImg = await loadImage(qrUrl);
  const qrY = innerY + 0.06 * DPI;
  ctx.drawImage(qrImg, leftCx - qrSize / 2, qrY, qrSize, qrSize);

  const idY = qrY + qrSize + 0.16 * DPI;
  ctx.fillStyle = BRAND_NAVY;
  ctx.font = `600 ${Math.round(0.062 * DPI)}px sans-serif`;
  ctx.fillText(`ID: ${cardId}`, leftCx, idY);

  // ── Right column: wordmark, subtitle, instructions, footer ──────
  let y = innerY + 0.16 * DPI;

  // Capsule icon beside a compact wordmark.
  const pillH = 0.22 * DPI;
  const pillW = pillH * 2.1;
  const wordFont = `800 ${Math.round(0.22 * DPI)}px sans-serif`;
  ctx.font = wordFont;
  const wordWidth = ctx.measureText("QRdose").width;
  const groupWidth = pillW + 0.06 * DPI + wordWidth;
  const groupX = rightCx - groupWidth / 2;

  const pillX = groupX;
  const pillY = y - pillH / 2;
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = "#e8f4f2";
  ctx.fill();
  roundRect(ctx, pillX + pillW / 2, pillY, pillW / 2, pillH, pillH / 2);
  ctx.fillStyle = BRAND_TEAL;
  ctx.fill();

  ctx.fillStyle = BRAND_NAVY;
  ctx.font = wordFont;
  ctx.textAlign = "left";
  ctx.fillText("QRdose", pillX + pillW + 0.06 * DPI, y);
  ctx.textAlign = "center";

  y += 0.19 * DPI;
  ctx.fillStyle = BRAND_TEAL;
  ctx.font = `700 ${Math.round(0.068 * DPI)}px sans-serif`;
  ctx.fillText("MEDICATION ALERT NETWORK", rightCx, y);

  y += 0.1 * DPI;
  ctx.strokeStyle = "#c9dede";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rightX, y);
  ctx.lineTo(rightX + (innerW - leftW - 0.12 * DPI), y);
  ctx.stroke();

  y += 0.15 * DPI;
  ctx.fillStyle = BRAND_TEAL;
  ctx.font = `700 ${Math.round(0.058 * DPI)}px sans-serif`;
  const instructionW = innerW - leftW - 0.12 * DPI;
  wrapText(
    ctx,
    "USE ANY SMART PHONE TO SCAN THE QR CODE OR TAP",
    rightCx,
    y,
    instructionW,
    0.078 * DPI
  );

  // Footer, pinned to the bottom of the right column.
  const footerY = innerY + innerH - 0.08 * DPI;
  ctx.fillStyle = BRAND_TEAL;
  ctx.font = `700 ${Math.round(0.052 * DPI)}px sans-serif`;
  ctx.fillText("SUPPORT@QRDOSE.COM", rightCx, footerY);

  return canvas.toBuffer("image/png");
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

/** PNG preview of the printable card, at 300dpi. */
export async function cardPngBuffer(cardId: string): Promise<Buffer> {
  return renderCardPng(cardId);
}

/**
 * Print-ready PDF: a single page sized exactly 3.375in x 2.125in (no bleed),
 * the card face filling the full page so it prints edge-to-edge at 1:1 scale.
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
