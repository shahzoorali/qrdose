import Link from "next/link";
import { currentUser } from "@/lib/session";
import { countContacts } from "@/lib/repositories/contacts";
import { listTriggers } from "@/lib/repositories/history";

export default async function OverviewPage() {
  const user = (await currentUser())!;
  const [contactCount, triggers] = await Promise.all([
    countContacts(user.userId),
    listTriggers(user.userId, 5),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome, {user.name}
        </h1>
        <p className="mt-1 text-slate-600">
          Here&apos;s the state of your QRdose card.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Contacts" value={`${contactCount} / 10`} href="/dashboard/contacts" />
        <Stat label="Total notifications" value={`${triggers.length >= 5 ? "5+" : triggers.length}`} href="/dashboard/history" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-medium text-slate-500">
          Current notification message
        </h2>
        <p className="mt-2 text-lg font-medium text-slate-900">
          &ldquo;{user.notificationMessage} at [time].&rdquo;
        </p>
        <Link
          href="/dashboard/message"
          className="mt-3 inline-block text-sm font-semibold text-brand-700"
        >
          Edit message →
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-medium text-slate-500">Your card</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your QRdose card is issued and managed by QRdose. Contact support if
          your card is lost, damaged, or needs to be replaced.
        </p>
      </section>

      {contactCount === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          You haven&apos;t added any contacts yet. Add at least one before
          tapping your card.{" "}
          <Link href="/dashboard/contacts" className="font-semibold underline">
            Add contacts
          </Link>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-sm"
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </Link>
  );
}
