"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";

const RESULT_MESSAGES: Record<string, { text: string; ok: boolean }> = {
  connected: { text: "Google Calendar connected.", ok: true },
  denied: {
    text: "Calendar access wasn't granted, so nothing was connected.",
    ok: false,
  },
  error: { text: "Couldn't connect Google Calendar. Please try again.", ok: false },
};

export function GoogleCalendarSync() {
  const params = useSearchParams();
  const [available, setAvailable] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const result = RESULT_MESSAGES[params.get("gcal") ?? ""];

  useEffect(() => {
    fetch("/api/google/calendar")
      .then((res) => res.json())
      .then((data) => {
        setAvailable(Boolean(data.available));
        setConnected(Boolean(data.connected));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  async function disconnect() {
    setBusy(true);
    const res = await fetch("/api/google/calendar", { method: "DELETE" });
    setBusy(false);
    if (res.ok) setConnected(false);
  }

  // Hidden entirely until the deployment has Google OAuth configured.
  if (loading || !available) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start gap-4">
        <CalendarDays className="mt-0.5 h-6 w-6 flex-none text-brand-600" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">Sync to Google Calendar</p>
          <p className="mt-0.5 text-sm text-slate-500">
            {connected
              ? "Your dose times appear in a “QRdose Reminders” calendar in Google, with an alert at each dose."
              : "Add your dose times to a separate “QRdose Reminders” calendar, with an alert at each dose."}{" "}
            Events just say &ldquo;Take your medication&rdquo; — medication
            names are never sent to Google. QRdose can only see the calendar it
            creates.
          </p>
          {connected && (
            <p className="mt-2 text-xs text-slate-400">
              Changes you make here update the calendar automatically. Edits
              made in Google Calendar aren&apos;t copied back.
            </p>
          )}
          {result && (
            <p
              className={`mt-2 text-sm ${result.ok ? "text-brand-700" : "text-red-600"}`}
            >
              {result.text}
            </p>
          )}
          <div className="mt-4">
            {connected ? (
              <button
                type="button"
                onClick={disconnect}
                disabled={busy}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {busy ? "Disconnecting…" : "Disconnect"}
              </button>
            ) : (
              <a
                href="/api/google/connect"
                className="inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Connect Google Calendar
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
