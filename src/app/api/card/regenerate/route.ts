import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { newCardId } from "@/lib/ids";
import { updateCardId } from "@/lib/repositories/users";
import { deleteCardMapping, putCardMapping } from "@/lib/repositories/cards";

export const runtime = "nodejs";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const newId = newCardId();
  await putCardMapping(newId, user.userId);
  await updateCardId(user.userId, newId);
  // Invalidate the old link last so a failure never leaves the user card-less.
  if (user.cardId && user.cardId !== newId) {
    await deleteCardMapping(user.cardId);
  }

  return NextResponse.json({ cardId: newId });
}
