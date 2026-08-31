import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { listAllUsers } from "@/lib/repositories/users";
import { countContacts } from "@/lib/repositories/contacts";
import { listTriggers } from "@/lib/repositories/history";
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

  // Per-user extras for the admin table. Each is a single indexed Query
  // (not a Scan), so this is cheap even at the 100-per-page ceiling above.
  const rows = await Promise.all(
    users.map(async (u) => {
      const [contactCount, lastTriggers] = await Promise.all([
        countContacts(u.userId),
        listTriggers(u.userId, 1),
      ]);
      return {
        ...toPublicUser(u),
        contactCount,
        lastNotifiedAt: lastTriggers[0]?.timestamp ?? null,
      };
    })
  );

  return NextResponse.json({ users: rows, cursor });
}
