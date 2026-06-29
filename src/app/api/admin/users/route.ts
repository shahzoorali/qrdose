import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { listAllUsers } from "@/lib/repositories/users";
import { toPublicUser } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const cursorParam = url.searchParams.get("cursor");
  let startKey: Record<string, unknown> | undefined;
  if (cursorParam) {
    try {
      startKey = JSON.parse(
        Buffer.from(cursorParam, "base64").toString("utf8")
      );
    } catch {
      return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
    }
  }

  const { users, lastKey } = await listAllUsers(100, startKey);
  const cursor = lastKey
    ? Buffer.from(JSON.stringify(lastKey)).toString("base64")
    : null;

  return NextResponse.json({ users: users.map(toPublicUser), cursor });
}
