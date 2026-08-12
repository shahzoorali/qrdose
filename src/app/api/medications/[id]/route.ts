import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { medicationSchema } from "@/lib/validation";
import {
  deleteMedication,
  getMedication,
  putMedication,
} from "@/lib/repositories/medications";
import type { Medication } from "@/lib/types";

export const runtime = "nodejs";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = medicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const existing = await getMedication(userId, id);
  if (!existing) {
    return NextResponse.json({ error: "Medication not found" }, { status: 404 });
  }

  const medication: Medication = {
    ...existing,
    name: parsed.data.name,
    time: parsed.data.time,
    enabled: parsed.data.enabled ?? existing.enabled,
  };
  await putMedication(userId, medication);

  return NextResponse.json({ medication });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteMedication(userId, id);
  return NextResponse.json({ ok: true });
}
