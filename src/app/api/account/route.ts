import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { settingsSchema } from "@/lib/validation";
import { updateUserSettings } from "@/lib/repositories/users";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  await updateUserSettings(userId, parsed.data);
  return NextResponse.json({ ok: true });
}
