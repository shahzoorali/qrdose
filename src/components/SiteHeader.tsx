"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

const TICKER_TEXT =
  "QRdose notifies up to 10 contacts all at once, with a single tap or scan  •  No app needed  •  Zero maintenance required  •  $5.99 per user per month";

const MENU_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "mailto:support@qrdose.com", label: "Contact us" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30">
      {/* Ticker banner */}
      <div className="overflow-hidden bg-brand-700 py-2 text-white">
        <div className="animate-ticker flex w-max whitespace-nowrap text-xs font-medium">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="mx-6">
              {TICKER_TEXT}
            </span>
          ))}
        </div>
      </div>

      {/* Floating nav */}
      <div className="bg-gradient-to-b from-slate-50/95 to-transparent px-4 pb-4 pt-4 backdrop-blur sm:px-6">
        <nav className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-lg sm:px-6 sm:py-5">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Logo className="pointer-events-auto h-16" />
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            className="grid h-11 w-11 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-expanded={searchOpen}
              aria-label="Search"
              className="grid h-11 w-11 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <a
              href="mailto:support@qrdose.com"
              aria-label="Chat with us"
              className="grid h-11 w-11 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 5h16v11H8l-4 4V5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <Link
              href="/login"
              aria-label="Log in"
              className="grid h-11 w-11 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M5 20c1.4-3.6 4.4-5.5 7-5.5s5.6 1.9 7 5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
            <Link
              href="/signup"
              className="ml-1 hidden rounded-lg bg-brand-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 sm:block"
            >
              Create account
            </Link>
          </div>

          {menuOpen && (
            <div className="absolute left-4 top-full z-40 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              {MENU_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-50"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="mt-1 block rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 sm:hidden"
              >
                Create account
              </Link>
            </div>
          )}

          {searchOpen && (
            <div className="absolute left-4 right-4 top-full z-40 mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg sm:left-auto sm:w-72">
              <input
                type="search"
                autoFocus
                placeholder="Search QRdose…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-400"
              />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
