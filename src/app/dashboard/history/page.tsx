import { currentUser } from "@/lib/session";
import { listTriggers } from "@/lib/repositories/history";

const statusStyles: Record<string, string> = {
  sent: "bg-green-100 text-green-700",
  partial: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

export default async function HistoryPage() {
  const user = (await currentUser())!;
  const triggers = await listTriggers(user.userId, 100);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: user.timezone || "America/New_York",
    }).format(new Date(iso));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Trigger history
        </h1>
        <p className="mt-1 text-slate-600">
          Every time your card was tapped and contacts were notified.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        {triggers.length === 0 ? (
          <p className="p-6 text-slate-500">No triggers yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {triggers.map((t) => (
              <li
                key={t.timestamp}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {fmt(t.timestamp)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t.successCount} of {t.recipientCount} contacts notified
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    statusStyles[t.status] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
