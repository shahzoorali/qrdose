import Image from "next/image";
import { currentUser } from "@/lib/session";
import { qrDataUrl, triggerUrl } from "@/lib/qrcode";
import { RegenerateButton } from "./RegenerateButton";

export default async function CardPage() {
  const user = (await currentUser())!;
  const [qr, url] = await Promise.all([
    qrDataUrl(user.cardId),
    Promise.resolve(triggerUrl(user.cardId)),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Your card
        </h1>
        <p className="mt-1 text-slate-600">
          Scan the QR with any phone camera, or program an NFC card with the
          link below.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          {/* Data-URL QR; next/image with unoptimized to skip the loader. */}
          <Image
            src={qr}
            alt="Your QRdose QR code"
            width={256}
            height={256}
            unoptimized
            className="mx-auto rounded-lg"
          />
          <p className="mt-3 text-sm text-slate-500">Scan to notify contacts</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Trigger link (for NFC programming)
            </p>
            <code className="mt-2 block break-all rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {url}
            </code>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Card ID</p>
            <code className="mt-2 block rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {user.cardId}
            </code>
          </div>
          <div className="pt-2">
            <RegenerateButton />
          </div>
        </div>
      </div>
    </div>
  );
}
