import QRCode from "qrcode";
import { APP_BASE_URL } from "./env";

/** The URL embedded in both the QR code and the NFC card. */
export function triggerUrl(cardId: string): string {
  return `${APP_BASE_URL.replace(/\/$/, "")}/t/${cardId}`;
}

/** PNG data URL for the card's trigger link, suitable for <img src>. */
export async function qrDataUrl(cardId: string): Promise<string> {
  return QRCode.toDataURL(triggerUrl(cardId), {
    width: 320,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}
