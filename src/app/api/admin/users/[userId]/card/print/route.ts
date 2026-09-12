import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { getUserById } from "@/lib/repositories/users";
import { cardPdfBuffer, cardPngBuffer } from "@/lib/card";

export const runtime = "nodejs";

/**
 * Print-ready assets for a user's physical card (3.375in x 2.125in, no
 * bleed) — the same design as a single downloadable file. Admin only.
 *
 * ?format=pdf (default) returns a print-ready PDF sized to the card.
 * ?format=png returns a 300dpi PNG preview of the same design.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const format = new URL(req.url).searchParams.get("format") === "png" ? "png" : "pdf";

  if (format === "png") {
    const png = await cardPngBuffer(user.cardId);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="qrdose-card-${user.cardId}.png"`,
      },
    });
  }

  const pdf = await cardPdfBuffer(user.cardId);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="qrdose-card-${user.cardId}.pdf"`,
    },
  });
}
