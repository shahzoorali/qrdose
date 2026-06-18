export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Billing
        </h1>
        <p className="mt-1 text-slate-600">Manage your QRdose subscription.</p>
      </div>

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
    </div>
  );
}
