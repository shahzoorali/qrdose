"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatUsPhone } from "@/lib/phone";
import { MAX_CONTACTS } from "@/lib/env";
import type { PublicUser } from "@/lib/types";

/** What the admin API sends: a PublicUser plus a couple of cheap per-user
 *  lookups (contact count, last trigger) that don't live on the user record. */
type AdminUserRow = PublicUser & {
  contactCount: number;
  lastNotifiedAt: string | null;
};

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

/** Subscription status alone no longer says who's actually paying — a
 *  "Comped" account also reads as "active". Split it into what matters. */
function PlanBadge({ user }: { user: PublicUser }) {
  const status = user.subscriptionStatus ?? "none";
  const isLive = status === "active" || status === "trialing";

  let label: string;
  let classes: string;
  if (isLive && user.stripeCustomerId) {
    label = "Paid";
    classes = "bg-green-50 text-green-700";
  } else if (isLive && user.grandfatheredAt) {
    label = "Comped";
    classes = "bg-blue-50 text-blue-700";
  } else if (status === "past_due") {
    label = "Past due";
    classes = "bg-amber-50 text-amber-700";
  } else if (status === "canceled") {
    label = "Canceled";
    classes = "bg-slate-100 text-slate-600";
  } else {
    label = "Inactive";
    classes = "bg-slate-100 text-slate-500";
  }

  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}

type SortKey = "name" | "joined";
type SortDir = "asc" | "desc";

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-1 hover:text-slate-900 ${
          active ? "text-slate-900" : ""
        }`}
      >
        {label}
        <span className="text-[10px]">
          {active ? (dir === "asc" ? "▲" : "▼") : ""}
        </span>
      </button>
    </th>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "joined" ? "desc" : "asc");
    }
  }

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

  const sorted = [...filtered].sort((a, b) => {
    const cmp =
      sortKey === "name"
        ? a.name.localeCompare(b.name)
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortDir === "asc" ? cmp : -cmp;
  });

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
              <SortHeader
                label="Name"
                active={sortKey === "name"}
                dir={sortDir}
                onClick={() => toggleSort("name")}
              />
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Contacts</th>
              <th className="px-4 py-3 font-medium">Last notified</th>
              <SortHeader
                label="Joined"
                active={sortKey === "joined"}
                dir={sortDir}
                onClick={() => toggleSort("joined")}
              />
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => (
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
                <td className="px-4 py-3">
                  <PlanBadge user={u} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {u.contactCount}/{MAX_CONTACTS}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {u.lastNotifiedAt
                    ? new Date(u.lastNotifiedAt).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
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
