"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; count: number }
  | { kind: "error"; message: string };

export function TriggerButton({ cardId }: { cardId: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function notify() {
    setState({ kind: "sending" });
    try {
      const res = await fetch(`/api/trigger/${cardId}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({
          kind: "error",
          message: data.error ?? "Could not send. Please try again.",
        });
        return;
      }
      setState({ kind: "sent", count: data.recipientCount ?? 0 });
    } catch {
      setState({ kind: "error", message: "Network error. Please try again." });
    }
  }

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
      </div>
    );
  }

  return (
    <div className="text-center">
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
    </div>
  );
}
