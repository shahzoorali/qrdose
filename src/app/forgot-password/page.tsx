"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell, Field } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }
    // Always proceed — the API never reveals whether the account exists.
    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  }

  return (
    <AuthShell
      title="Reset your password"
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-brand-700">
            Log in
          </Link>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        Enter your email and we&apos;ll text a 6-digit reset code to the phone
        number on your account.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" name="email" type="email" autoComplete="email" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset code"}
        </button>
      </form>
    </AuthShell>
  );
}
