import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { messageSchema } from "@/lib/validation";
import { updateNotificationMessage } from "@/lib/repositories/users";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  await updateNotificationMessage(userId, parsed.data.notificationMessage);
  return NextResponse.json({ ok: true });
}
