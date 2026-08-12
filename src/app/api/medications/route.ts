import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { medicationSchema } from "@/lib/validation";
import { newMedicationId } from "@/lib/ids";
import {
  countMedications,
  listMedications,
  putMedication,
} from "@/lib/repositories/medications";
import { MAX_MEDICATIONS } from "@/lib/env";
import type { Medication } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const medications = await listMedications(userId);
  return NextResponse.json({ medications });
}

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = medicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const count = await countMedications(userId);
  if (count >= MAX_MEDICATIONS) {
    return NextResponse.json(
      { error: `You can add up to ${MAX_MEDICATIONS} medications` },
      { status: 422 }
    );
  }

  const medication: Medication = {
    medId: newMedicationId(),
    name: parsed.data.name,
    time: parsed.data.time,
    enabled: parsed.data.enabled ?? true,
    createdAt: new Date().toISOString(),
  };
  await putMedication(userId, medication);

  return NextResponse.json({ medication }, { status: 201 });
}
