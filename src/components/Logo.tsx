import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
          <rect x="14" y="14" width="3" height="3" rx="0.8" fill="currentColor" />
          <rect x="18" y="18" width="3" height="3" rx="0.8" fill="currentColor" />
        </svg>
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900">
        QRdose
      </span>
    </Link>
  );
}
