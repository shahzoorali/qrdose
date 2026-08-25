import Link from "next/link";
import { UserPlus, Users, ScanLine, BellRing, AlertTriangle, CheckCircle2 } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { STRIPE_ENABLED } from "@/lib/env";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <video
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          src="/qrdose-promo.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/55 to-black/75" />
        <div className="relative z-10 mx-auto max-w-4xl px-8 py-20 text-center lg:py-28">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Medication Management, Simplified.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-200">
            QRdose notifies up to 10 contacts all at once, with a single tap
            or scan. No app, no fuss.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#how"
              className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Product demo video */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 shadow-xl">
          <video
            className="w-full scale-110 object-cover"
            src="/qrdose-flow.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
          Set it up once.
          <br />
          Tap it daily.
        </h2>
        <div className="mt-6 flex justify-center">
          <LogoMark className="h-12 w-auto" />
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "1",
              title: "Create account",
              body: "No app to download.",
              icon: UserPlus,
              iconBg: "bg-blue-100",
              iconColor: "text-blue-600",
            },
            {
              step: "2",
              title: "Add your contacts",
              body: "Add up to 10 contacts to notify, and craft a personalized message they'll get every time you tap or scan.",
              icon: Users,
              iconBg: "bg-purple-100",
              iconColor: "text-purple-600",
            },
            {
              step: "3",
              title: "Tap or Scan",
              body: "Receive your ready to use card. Use any smartphone to Tap or Scan to send notifications to your contacts.",
              icon: ScanLine,
              iconBg: "bg-emerald-100",
              iconColor: "text-emerald-600",
            },
            {
              step: "4",
              title: "Set a Reminder",
              body: "Stay on track by scheduling alerts for yourself and your contacts.",
              icon: BellRing,
              iconBg: "bg-amber-100",
              iconColor: "text-amber-600",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <span
                  className={`grid h-12 w-12 flex-none place-items-center rounded-xl ${s.iconBg} ${s.iconColor}`}
                >
                  <s.icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <span className="text-sm font-semibold text-slate-300">
                  {s.step}
                </span>
              </div>
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
              Your contacts get a text, instantly.
            </h2>
            <ul className="mt-6 space-y-3 text-slate-600">
              {[
                "No apps",
                "No sign up",
                "Delivered by text and/or email",
                "Includes the exact time of tap or scan",
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
              <div className="flex max-w-[80%] items-start gap-2 rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" strokeWidth={2} />
                Carol has taken her medication at 8:02 AM.
              </div>
              <div className="flex max-w-[80%] items-start gap-2 rounded-2xl rounded-bl-sm bg-amber-50 px-4 py-3 text-sm text-slate-800 shadow-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-amber-600" strokeWidth={2} />
                Carol has NOT taken her medication at 2:34 PM.
              </div>
              <div className="flex max-w-[80%] items-start gap-2 rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" strokeWidth={2} />
                Carol has taken her medication at 9:15 PM.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing (Stripe placeholder) */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
          Simple Pricing
        </h2>
        <p className="mt-3 text-center text-slate-600">
          One plan, everything included.
        </p>
        <div className="mx-auto mt-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">QRdose Card</h3>
          <p className="mt-2 text-4xl font-bold text-slate-900">
            $5.99<span className="text-base font-medium text-slate-500">/mo</span>
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li>Includes easy tap card with personalized QR code</li>
            <li>Up to 10 contacts</li>
            <li>Unlimited notifications</li>
            <li>Notification history &amp; web portal</li>
          </ul>
          {STRIPE_ENABLED ? (
            <Link
              href="/signup"
              className="mt-8 block w-full rounded-lg bg-brand-600 px-6 py-3 text-center text-base font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Get started
            </Link>
          ) : (
            <>
              <button
                disabled
                className="mt-8 w-full cursor-not-allowed rounded-lg bg-slate-200 px-6 py-3 text-base font-semibold text-slate-500"
              >
                Payments coming soon
              </button>
              <p className="mt-3 text-center text-xs text-slate-400">
                Checkout via Stripe is being set up. Create your account now to
                get ready.
              </p>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Ready to simplify your medication?
          </h2>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
          >
            Get started today
          </Link>
        </div>
      </section>
    </div>
  );
}
