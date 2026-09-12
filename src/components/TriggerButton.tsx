"use client";

import { useState } from "react";

const MAX_ADDITIONAL_TEXT = 60;

type ContactState = "pending" | "sent" | "failed";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; count: number }
  | { kind: "error"; message: string };

export function TriggerButton({
  cardId,
  contacts,
  quickPhrases,
}: {
  cardId: string;
  contacts: { contactId: string; displayName: string }[];
  quickPhrases: string[];
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [additionalText, setAdditionalText] = useState("");
  const [progress, setProgress] = useState<Record<string, ContactState>>({});

  function addQuickPhrase(phrase: string) {
    setAdditionalText((prev) => {
      if (!prev) return phrase;
      if (prev.includes(phrase)) return prev;
      const combined = `${prev} ${phrase}`;
      return combined.slice(0, MAX_ADDITIONAL_TEXT);
    });
  }

  async function notify() {
    setState({ kind: "sending" });
    setProgress(Object.fromEntries(contacts.map((c) => [c.contactId, "pending"])));

    try {
      const res = await fetch(`/api/trigger/${cardId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additionalText }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setState({
          kind: "error",
          message: data.error ?? "Could not send. Please try again.",
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalCount: number | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const raw of lines) {
          if (!raw.trim()) continue;
          const parsed = JSON.parse(raw) as
            | { contactId: string; ok: boolean }
            | { done: true; successCount: number };
          if ("done" in parsed) {
            finalCount = parsed.successCount;
          } else {
            setProgress((prev) => ({
              ...prev,
              [parsed.contactId]: parsed.ok ? "sent" : "failed",
            }));
          }
        }
      }

      if (finalCount === null || finalCount === 0) {
        setState({
          kind: "error",
          message: "Could not send notifications. Please try again.",
        });
        return;
      }
      setState({ kind: "sent", count: finalCount });
    } catch {
      setState({ kind: "error", message: "Network error. Please try again." });
    }
  }

  const recipientList = contacts.length > 0 && (
    <div className="mt-6 w-full text-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Notifying
      </p>
      <ul className="mt-2 space-y-1.5">
        {contacts.map((c) => {
          const status = progress[c.contactId] ?? "pending";
          return (
            <li
              key={c.contactId}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <span className="text-slate-700">{c.displayName}</span>
              {status === "sent" && (
                <span aria-label="Notified" className="text-green-600">
                  ✅
                </span>
              )}
              {status === "failed" && (
                <span aria-label="Not delivered" className="text-red-500">
                  ⚠️
                </span>
              )}
              {status === "pending" && state.kind === "sending" && (
                <span className="text-slate-300">…</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );

  if (state.kind === "sent") {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-5 text-2xl font-bold text-slate-900">
          Your contacts have been notified.
        </h2>
        <p className="mt-2 text-slate-600">
          {state.count} {state.count === 1 ? "person" : "people"} received your
          message.
        </p>
        {recipientList}
      </div>
    );
  }

  return (
    <div className="text-center">
      {state.kind === "idle" && (
        <div className="mb-5 text-left">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Additional text (optional)
            </span>
            <input
              value={additionalText}
              onChange={(e) => setAdditionalText(e.target.value.slice(0, MAX_ADDITIONAL_TEXT))}
              maxLength={MAX_ADDITIONAL_TEXT}
              placeholder="Add a short note…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </label>
          {quickPhrases.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {quickPhrases.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => addQuickPhrase(p)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  + {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={notify}
        disabled={state.kind === "sending"}
        className="w-full rounded-xl bg-brand-600 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        {state.kind === "sending" ? "Sending…" : "Notify my contacts"}
      </button>
      {state.kind === "error" && (
        <p className="mt-4 text-sm text-red-600">{state.message}</p>
      )}
      <p className="mt-4 text-xs text-slate-400">
        Tapping this sends a text to everyone on this card&apos;s contact list.
      </p>
      {state.kind === "sending" && recipientList}
    </div>
  );
}
