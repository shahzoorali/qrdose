"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegenerateButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function regenerate() {
    setBusy(true);
    await fetch("/api/card/regenerate", { method: "POST" });
    setBusy(false);
    setConfirming(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Regenerate card
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
      <p className="text-amber-800">
        Regenerating creates a new QR/link and{" "}
        <strong>permanently disables the old card</strong>. Continue?
      </p>
      <div className="flex gap-2">
        <button
          onClick={regenerate}
          disabled={busy}
          className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Regenerating…" : "Yes, regenerate"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
