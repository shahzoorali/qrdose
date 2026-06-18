"use client";

import { useState } from "react";

export function MessageForm({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    setError(null);
    const res = await fetch("/api/message", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationMessage: value }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save");
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          Notification message
        </span>
        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          rows={3}
          maxLength={280}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <span className="mt-1 block text-xs text-slate-400">
          {value.length}/280 — the time is appended automatically when sent.
        </span>
      </label>

      <div className="rounded-lg bg-slate-50 px-4 py-3">
        <p className="text-xs font-medium text-slate-400">Preview</p>
        <p className="mt-1 text-slate-800">
          &ldquo;{value || "Your message"} at 2:34 PM.&rdquo;
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Saved.</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save message"}
      </button>
    </form>
  );
}
