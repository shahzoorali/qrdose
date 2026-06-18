import { currentUser } from "@/lib/session";
import { STRIPE_ENABLED } from "@/lib/env";
import { hasActiveSubscription } from "@/lib/billing";
import { CheckoutButton } from "@/components/CheckoutButton";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = (await currentUser())!;
  const { status } = await searchParams;
  const active = hasActiveSubscription(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Billing
        </h1>
        <p className="mt-1 text-slate-600">Manage your QRdose subscription.</p>
      </div>

      {status === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Thanks! Your subscription is being activated.
        </div>
      )}
      {status === "cancelled" && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Checkout was cancelled. You can subscribe any time.
        </div>
      )}

      {!STRIPE_ENABLED ? (
        // Billing not yet configured — safe placeholder.
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100">
            <svg
              className="h-6 w-6 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Payments coming soon
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-slate-600">
            We&apos;re setting up secure checkout through Stripe. Your account is
            active in the meantime — no payment is required yet.
          </p>
          <button
            disabled
            className="mt-6 cursor-not-allowed rounded-lg bg-slate-200 px-5 py-2.5 font-semibold text-slate-500"
          >
            Set up payment
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Subscription status</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                <StatusBadge status={user.subscriptionStatus ?? "none"} />
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            {active ? (
              <p className="text-slate-600">
                Your subscription is active. Thank you for using QRdose!
              </p>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-slate-900">
                  QRdose Card
                </h3>
                <p className="mt-1 text-slate-600">
                  Subscribe to keep your card active and notifications flowing.
                </p>
                <div className="mt-5">
                  <CheckoutButton label="Subscribe" />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    trialing: "bg-blue-100 text-blue-700",
    past_due: "bg-amber-100 text-amber-700",
    canceled: "bg-red-100 text-red-700",
    none: "bg-slate-100 text-slate-600",
  };
  const labels: Record<string, string> = {
    active: "Active",
    trialing: "Trial",
    past_due: "Past due",
    canceled: "Cancelled",
    none: "Not subscribed",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-semibold ${
        styles[status] ?? styles.none
      }`}
    >
      {labels[status] ?? "Unknown"}
    </span>
  );
}
