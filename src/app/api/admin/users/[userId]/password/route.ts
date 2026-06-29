import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { currentAdmin } from "@/lib/admin";
import { adminPasswordSchema } from "@/lib/validation";
import { getUserById, updatePassword } from "@/lib/repositories/users";

export const runtime = "nodejs";

/** Set a new password for a user (admin-chosen). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  const target = await getUserById(userId);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = adminPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await updatePassword(userId, passwordHash);
  return NextResponse.json({ ok: true });
}
