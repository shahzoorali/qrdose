import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { adminRoleSchema } from "@/lib/validation";
import { getUserById, setAdminFlag } from "@/lib/repositories/users";

export const runtime = "nodejs";

/** Grant or revoke the admin role on a user account. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = adminRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  // An admin cannot revoke their own role (avoids locking out the dashboard).
  if (userId === admin.userId && parsed.data.isAdmin === false) {
    return NextResponse.json(
      { error: "You cannot remove your own admin role." },
      { status: 400 }
    );
  }

  const target = await getUserById(userId);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await setAdminFlag(userId, parsed.data.isAdmin);
  return NextResponse.json({ ok: true });
}
