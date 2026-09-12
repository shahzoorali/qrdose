"use client";

import { useState } from "react";

export function MessageForm({
  initial,
  initialQuickPhrases,
}: {
  initial: string;
  initialQuickPhrases: string[];
}) {
  const [value, setValue] = useState(initial);
  const [phrases, setPhrases] = useState(initialQuickPhrases);
  const [newPhrase, setNewPhrase] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function addPhrase() {
    const p = newPhrase.trim();
    if (!p || phrases.length >= 5) return;
    setPhrases([...phrases, p]);
    setNewPhrase("");
    setSaved(false);
  }

  function removePhrase(i: number) {
    setPhrases(phrases.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    setError(null);
    const res = await fetch("/api/message", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationMessage: value, quickPhrases: phrases }),
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

      <div>
        <span className="text-sm font-medium text-slate-700">
          Quick add-ins (optional)
        </span>
        <p className="mt-1 text-xs text-slate-500">
          Short notes the scanner can tap to add before sending, e.g.
          &ldquo;Running late&rdquo; or &ldquo;Took a double dose&rdquo;. Up to
          5, shown on the public scan page.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {phrases.map((p, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700"
            >
              {p}
              <button
                type="button"
                onClick={() => removePhrase(i)}
                aria-label={`Remove ${p}`}
                className="text-brand-400 hover:text-brand-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {phrases.length < 5 && (
          <div className="mt-2 flex gap-2">
            <input
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPhrase();
                }
              }}
              maxLength={40}
              placeholder="Add a quick phrase…"
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
            <button
              type="button"
              onClick={addPhrase}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Add
            </button>
          </div>
        )}
      </div>

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
