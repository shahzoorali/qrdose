"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { US_TIMEZONES } from "@/lib/timezones";
import { formatUsPhone } from "@/lib/phone";
import type { PublicUser, Contact, TriggerLog } from "@/lib/types";

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";
const cardCls = "rounded-2xl border border-slate-200 bg-white p-6";

export function AdminUserForm({
  user,
  contacts,
  history,
  isSelf,
}: {
  user: PublicUser;
  contacts: Contact[];
  history: TriggerLog[];
  isSelf: boolean;
}) {
  const router = useRouter();

  // ── Details ──────────────────────────────────────────────────────
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [timezone, setTimezone] = useState(user.timezone);
  const [detailsMsg, setDetailsMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSavingDetails(true);
    setDetailsMsg(null);
    const res = await fetch(`/api/admin/users/${user.userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, timezone }),
    });
    setSavingDetails(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDetailsMsg({ ok: false, text: data.error ?? "Could not save" });
      return;
    }
    setDetailsMsg({ ok: true, text: "Saved." });
    router.refresh();
  }

  // ── Password ─────────────────────────────────────────────────────
  const [password, setPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPw(true);
    setPwMsg(null);
    const res = await fetch(`/api/admin/users/${user.userId}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSavingPw(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPwMsg({ ok: false, text: data.error ?? "Could not set password" });
      return;
    }
    setPassword("");
    setPwMsg({ ok: true, text: "Password updated." });
  }

  // ── Status ───────────────────────────────────────────────────────
  const [disabled, setDisabled] = useState(user.accountStatus === "disabled");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  async function toggleStatus() {
    setSavingStatus(true);
    setStatusMsg(null);
    const next = disabled ? "active" : "disabled";
    const res = await fetch(`/api/admin/users/${user.userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSavingStatus(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatusMsg(data.error ?? "Could not update status");
      return;
    }
    setDisabled(next === "disabled");
    router.refresh();
  }

  // ── Delete ───────────────────────────────────────────────────────
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  async function deleteUser() {
    if (
      !confirm(
        `Permanently delete ${user.name} (${user.email}) and all their data? This cannot be undone.`
      )
    )
      return;
    setDeleting(true);
    setDeleteErr(null);
    const res = await fetch(`/api/admin/users/${user.userId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleting(false);
      setDeleteErr(data.error ?? "Could not delete");
      return;
    }
    router.push("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {user.name}
          {user.isAdmin && (
            <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-500">
              Admin
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {user.userId} · joined {new Date(user.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Details */}
      <form onSubmit={saveDetails} className={`${cardCls} space-y-4`}>
        <h2 className="text-sm font-semibold text-slate-900">Details</h2>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Phone</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputCls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Timezone</span>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls}>
            {US_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </label>
        {detailsMsg && (
          <p className={`text-sm ${detailsMsg.ok ? "text-green-600" : "text-red-600"}`}>
            {detailsMsg.text}
          </p>
        )}
        <button
          type="submit"
          disabled={savingDetails}
          className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {savingDetails ? "Saving…" : "Save details"}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={savePassword} className={`${cardCls} space-y-4`}>
        <h2 className="text-sm font-semibold text-slate-900">Set new password</h2>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">New password</span>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={inputCls}
          />
        </label>
        {pwMsg && (
          <p className={`text-sm ${pwMsg.ok ? "text-green-600" : "text-red-600"}`}>
            {pwMsg.text}
          </p>
        )}
        <button
          type="submit"
          disabled={savingPw || password.length < 8}
          className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {savingPw ? "Updating…" : "Update password"}
        </button>
      </form>

      {/* Status */}
      <div className={`${cardCls} space-y-3`}>
        <h2 className="text-sm font-semibold text-slate-900">Account status</h2>
        <p className="text-sm text-slate-600">
          This account is currently{" "}
          <span className={disabled ? "font-semibold text-red-700" : "font-semibold text-green-700"}>
            {disabled ? "disabled" : "active"}
          </span>
          . {disabled ? "The user cannot log in and their card won't send notifications." : "Disabling blocks login and SMS triggers."}
        </p>
        {statusMsg && <p className="text-sm text-red-600">{statusMsg}</p>}
        {isSelf && !disabled && (
          <p className="text-xs text-slate-400">You cannot disable your own account.</p>
        )}
        <button
          onClick={toggleStatus}
          disabled={savingStatus || (isSelf && !disabled)}
          className={`rounded-lg px-5 py-2.5 font-semibold text-white transition disabled:opacity-60 ${
            disabled ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"
          }`}
        >
          {savingStatus ? "Saving…" : disabled ? "Enable account" : "Disable account"}
        </button>
      </div>

      {/* Contacts (read-only) */}
      <div className={cardCls}>
        <h2 className="text-sm font-semibold text-slate-900">
          Contacts ({contacts.length})
        </h2>
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {contacts.map((c) => (
            <li key={c.contactId} className="flex justify-between py-2">
              <span className="text-slate-900">{c.name}</span>
              <span className="text-slate-500">{formatUsPhone(c.phone)}</span>
            </li>
          ))}
          {contacts.length === 0 && (
            <li className="py-2 text-slate-500">No contacts.</li>
          )}
        </ul>
      </div>

      {/* History (read-only) */}
      <div className={cardCls}>
        <h2 className="text-sm font-semibold text-slate-900">
          Notification history ({history.length})
        </h2>
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {history.map((h, i) => (
            <li key={i} className="flex justify-between py-2">
              <span className="text-slate-700">
                {new Date(h.timestamp).toLocaleString()}
              </span>
              <span className="text-slate-500">
                {h.successCount}/{h.recipientCount} sent · {h.status}
              </span>
            </li>
          ))}
          {history.length === 0 && (
            <li className="py-2 text-slate-500">No notifications yet.</li>
          )}
        </ul>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-sm font-semibold text-red-800">Danger zone</h2>
        <p className="mt-1 text-sm text-red-700">
          Permanently delete this user and all their contacts, history, and card.
        </p>
        {deleteErr && <p className="mt-2 text-sm text-red-700">{deleteErr}</p>}
        {isSelf ? (
          <p className="mt-3 text-xs text-red-600">You cannot delete your own account.</p>
        ) : (
          <button
            onClick={deleteUser}
            disabled={deleting}
            className="mt-3 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete user"}
          </button>
        )}
      </div>
    </div>
  );
}
