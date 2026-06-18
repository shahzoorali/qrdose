import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <a
              href="#how"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
            >
              Pricing
            </a>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 to-slate-50" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-700">
              No app required • Works with any phone
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              One tap tells everyone who&nbsp;cares.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              QRdose turns a single tap or scan into an instant text to up to 10
              loved ones — &ldquo;Murt has taken his medication.&rdquo; No app,
              no fuss. Just a card on the fridge and peace of mind.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Create your card
              </Link>
              <a
                href="#how"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                See how it works
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Tap an NFC card or scan a QR code — that&apos;s the whole flow.
            </p>
          </div>

          {/* Visual: card + sample SMS */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="rotate-[-3deg] rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <Logo />
                <span className="text-xs font-medium text-slate-400">
                  Tap or scan
                </span>
              </div>
              <div className="mt-5 grid place-items-center rounded-xl bg-slate-50 py-8">
                <svg width="120" height="120" viewBox="0 0 24 24" aria-hidden>
                  <rect x="3" y="3" width="7" height="7" rx="1" fill="#1e293b" />
                  <rect x="14" y="3" width="7" height="7" rx="1" fill="#1e293b" />
                  <rect x="3" y="14" width="7" height="7" rx="1" fill="#1e293b" />
                  <rect x="14" y="14" width="3" height="3" fill="#1e293b" />
                  <rect x="18" y="18" width="3" height="3" fill="#1e293b" />
                  <rect x="14" y="18" width="3" height="3" fill="#1e293b" />
                  <rect x="18" y="14" width="3" height="3" fill="#1e293b" />
                </svg>
              </div>
              <p className="mt-4 text-center text-sm font-medium text-slate-500">
                Murt&apos;s daily check-in
              </p>
            </div>

            <div className="absolute -bottom-8 -right-2 w-64 rotate-[4deg] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <p className="text-xs font-medium text-slate-400">Text message</p>
              <p className="mt-1 rounded-2xl rounded-bl-sm bg-brand-600 px-4 py-2 text-sm text-white">
                Murt has taken his medication at 2:34 PM.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
          Set it up once. Tap it every day.
        </h2>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Add your people",
              body: "Register, then add up to 10 contacts and write the one message they'll receive.",
            },
            {
              step: "2",
              title: "Get your card",
              body: "We generate a unique QR + NFC card. Stick it on the fridge, the pill box, anywhere.",
            },
            {
              step: "3",
              title: "Tap to notify",
              body: "A tap or scan opens a page — confirm, and everyone gets a text in seconds.",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
                {s.step}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                {s.title}
              </h3>
              <p className="mt-2 text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact experience */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Your contacts just get a text.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              No app to install, nothing to sign up for, no action needed. They
              receive a simple, reassuring message — informational only.
            </p>
            <ul className="mt-6 space-y-3 text-slate-600">
              {[
                "Delivered by SMS to any US phone",
                "Sent to all your contacts at once",
                "Includes the exact time it happened",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg
                    className="mt-1 h-5 w-5 flex-none text-brand-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
            <div className="space-y-3">
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
                Murt has taken his medication at 8:02 AM.
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
                Murt has taken his medication at 2:34 PM.
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
                Murt has taken his medication at 9:15 PM.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing (Stripe placeholder) */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
          Simple pricing
        </h2>
        <p className="mt-3 text-center text-slate-600">
          One plan, everything included.
        </p>
        <div className="mx-auto mt-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">QRdose Card</h3>
          <p className="mt-2 text-4xl font-bold text-slate-900">
            $—<span className="text-base font-medium text-slate-500">/mo</span>
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li>QR + NFC card included</li>
            <li>Up to 10 contacts</li>
            <li>Unlimited notifications</li>
            <li>Trigger history &amp; web portal</li>
          </ul>
          <button
            disabled
            className="mt-8 w-full cursor-not-allowed rounded-lg bg-slate-200 px-6 py-3 text-base font-semibold text-slate-500"
          >
            Payments coming soon
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">
            Checkout via Stripe is being set up. Create your account now to get
            ready.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Ready for one-tap peace of mind?
          </h2>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Logo />
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} QRdose.com — US only.
          </p>
        </div>
      </footer>
    </div>
  );
}
