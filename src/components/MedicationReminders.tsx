"use client";

import { useEffect, useState } from "react";

interface Medication {
  medId: string;
  name: string;
  time: string;
  enabled: boolean;
}

const MAX_MEDICATIONS = 10;

export function MedicationReminders() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [grace, setGrace] = useState(30);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [time, setTime] = useState("08:00");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedSettings, setSavedSettings] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [medsRes, settingsRes] = await Promise.all([
      fetch("/api/medications"),
      fetch("/api/reminders/settings"),
    ]);
    const meds = await medsRes.json().catch(() => ({}));
    const settings = await settingsRes.json().catch(() => ({}));
    setMedications(meds.medications ?? []);
    setRemindersEnabled(Boolean(settings.remindersEnabled));
    setGrace(settings.reminderGraceMinutes ?? 30);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveSettings(next: {
    remindersEnabled: boolean;
    reminderGraceMinutes: number;
  }) {
    setError(null);
    setSavedSettings(false);
    const res = await fetch("/api/reminders/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save reminder settings");
      return;
    }
    setSavedSettings(true);
  }

  function resetForm() {
    setName("");
    setTime("08:00");
    setEditingId(null);
    setError(null);
  }

  async function saveMedication(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const url = editingId ? `/api/medications/${editingId}` : "/api/medications";
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, time }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save medication");
      return;
    }
    resetForm();
    await load();
  }

  async function toggleMedication(med: Medication) {
    await fetch(`/api/medications/${med.medId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: med.name,
        time: med.time,
        enabled: !med.enabled,
      }),
    });
    await load();
  }

  async function remove(medId: string) {
    await fetch(`/api/medications/${medId}`, { method: "DELETE" });
    if (editingId === medId) resetForm();
    await load();
  }

  function startEdit(med: Medication) {
    setEditingId(med.medId);
    setName(med.name);
    setTime(med.time);
    setError(null);
  }

  const atLimit = medications.length >= MAX_MEDICATIONS && !editingId;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Medication reminders
        </h2>
        <p className="mt-1 text-slate-600">
          Add the medications you take and when you take them. If you
          haven&apos;t tapped or scanned your card by the time a dose is due,
          QRdose will remind you.
        </p>
      </div>

      {/* How escalation works — users need to know contacts can be pulled in. */}
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">How reminders work</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            <span className="font-medium">You first.</span> {grace} minutes after
            a scheduled dose, we text and email{" "}
            <span className="font-medium">you only</span> — your contacts
            aren&apos;t involved yet.
          </li>
          <li>
            <span className="font-medium">Then your contacts.</span> If the dose
            is still unconfirmed {grace * 2} minutes after it was due, everyone
            on your contacts list is notified that you may have missed it.
          </li>
          <li>
            <span className="font-medium">Tapping stops it.</span> A single tap
            or scan confirms every medication scheduled around that time.
          </li>
        </ol>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <label className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={remindersEnabled}
            disabled={loading}
            onChange={(e) => {
              const next = e.target.checked;
              setRemindersEnabled(next);
              saveSettings({
                remindersEnabled: next,
                reminderGraceMinutes: grace,
              });
            }}
            className="h-5 w-5 flex-none accent-brand-600"
          />
          <span>
            <span className="font-medium text-slate-900">
              Turn reminders on
            </span>
            <span className="mt-0.5 block text-sm text-slate-500">
              Master switch for every medication below.
            </span>
          </span>
        </label>

        <label className="block border-t border-slate-100 pt-4">
          <span className="flex items-center gap-2 font-medium text-slate-900">
            Remind me after
            <input
              type="number"
              min={5}
              max={720}
              value={grace}
              disabled={loading}
              onChange={(e) => {
                setGrace(Number(e.target.value));
                setSavedSettings(false);
              }}
              onBlur={() =>
                saveSettings({
                  remindersEnabled,
                  reminderGraceMinutes: grace,
                })
              }
              className="w-20 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
            minutes
          </span>
          <span className="mt-1 block text-xs text-slate-400">
            Contacts are notified at double this ({grace * 2} minutes).
          </span>
        </label>

        {savedSettings && <p className="text-sm text-green-600">Saved.</p>}
      </div>

      <form
        onSubmit={saveMedication}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-[1fr_auto_auto] sm:items-end"
      >
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Medication name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Time</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy || atLimit}
            className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {editingId ? "Update" : "Add"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
            >
              Cancel
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
        {atLimit && (
          <p className="text-sm text-amber-700 sm:col-span-3">
            You&apos;ve reached the {MAX_MEDICATIONS}-medication limit. Remove
            one to add another.
          </p>
        )}
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : medications.length === 0 ? (
          <p className="p-6 text-slate-500">No medications yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {medications.map((med) => (
              <li
                key={med.medId}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {med.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {med.time}
                    {!med.enabled && " • reminders off"}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-4 text-sm font-medium">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      checked={med.enabled}
                      onChange={() => toggleMedication(med)}
                      className="h-4 w-4 accent-brand-600"
                    />
                    On
                  </label>
                  <button
                    onClick={() => startEdit(med)}
                    className="text-brand-700 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(med.medId)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
