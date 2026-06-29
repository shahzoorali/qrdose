"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatUsPhone } from "@/lib/phone";
import type { PublicUser } from "@/lib/types";

function StatusBadge({ user }: { user: PublicUser }) {
  const disabled = user.accountStatus === "disabled";
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
        disabled
          ? "bg-red-50 text-red-700"
          : "bg-green-50 text-green-700"
      }`}
    >
      {disabled ? "Disabled" : "Active"}
    </span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function load(next?: string | null) {
    setLoading(true);
    setError(null);
    const url = next
      ? `/api/admin/users?cursor=${encodeURIComponent(next)}`
      : "/api/admin/users";
    const res = await fetch(url);
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not load users");
      return;
    }
    const data = await res.json();
    setUsers((prev) => (next ? [...prev, ...data.users] : data.users));
    setCursor(data.cursor);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
    : users;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Users
          </h1>
          <p className="mt-1 text-slate-600">
            {users.length} loaded. Click a row to manage a user.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email…"
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Subscription</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.userId}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${u.userId}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {u.name}
                    {u.isAdmin && (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                        Admin
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{u.email}</td>
                <td className="px-4 py-3 text-slate-700">
                  {formatUsPhone(u.phone)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge user={u} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {u.subscriptionStatus ?? "none"}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        {cursor && (
          <button
            onClick={() => load(cursor)}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
        {loading && users.length === 0 && (
          <span className="text-sm text-slate-500">Loading…</span>
        )}
      </div>
    </div>
  );
}
