import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { newCardId } from "@/lib/ids";
import { getUserById, updateCardId } from "@/lib/repositories/users";
import { deleteCardMapping, putCardMapping } from "@/lib/repositories/cards";
import { qrDataUrl, triggerUrl } from "@/lib/qrcode";

export const runtime = "nodejs";

/** The user's card: QR image, trigger link and card id. Admins only. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    cardId: user.cardId,
    url: triggerUrl(user.cardId),
    qr: await qrDataUrl(user.cardId),
  });
}

/** Issue a new card for the user, invalidating the old QR/NFC link. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newId = newCardId();
  await putCardMapping(newId, userId);
  await updateCardId(userId, newId);
  // Invalidate the old link last so a failure never leaves the user card-less.
  if (user.cardId && user.cardId !== newId) {
    await deleteCardMapping(user.cardId);
  }

  return NextResponse.json({
    cardId: newId,
    url: triggerUrl(newId),
    qr: await qrDataUrl(newId),
  });
}
