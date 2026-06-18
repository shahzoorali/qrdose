"use client";

import { useEffect, useState } from "react";

interface Contact {
  contactId: string;
  name: string;
  phone: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/contacts");
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setName("");
    setPhone("");
    setEditingId(null);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const url = editingId ? `/api/contacts/${editingId}` : "/api/contacts";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save contact");
      return;
    }
    resetForm();
    await load();
  }

  function startEdit(c: Contact) {
    setEditingId(c.contactId);
    setName(c.name);
    setPhone(c.phone);
    setError(null);
  }

  async function remove(id: string) {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    await load();
  }

  const atLimit = contacts.length >= 10 && !editingId;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Contacts
        </h1>
        <p className="mt-1 text-slate-600">
          Up to 10 people who get a text when your card is tapped.{" "}
          <span className="font-medium text-slate-700">
            {contacts.length} / 10
          </span>
        </p>
      </div>

      <form
        onSubmit={save}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Phone (US)</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="(415) 555-2671"
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
        {error && (
          <p className="text-sm text-red-600 sm:col-span-3">{error}</p>
        )}
        {atLimit && (
          <p className="text-sm text-amber-700 sm:col-span-3">
            You&apos;ve reached the 10-contact limit. Remove one to add another.
          </p>
        )}
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : contacts.length === 0 ? (
          <p className="p-6 text-slate-500">No contacts yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {contacts.map((c) => (
              <li
                key={c.contactId}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.phone}</p>
                </div>
                <div className="flex gap-3 text-sm font-medium">
                  <button
                    onClick={() => startEdit(c)}
                    className="text-brand-700 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(c.contactId)}
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
    </div>
  );
}
