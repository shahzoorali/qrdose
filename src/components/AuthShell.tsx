import { Logo } from "@/components/Logo";

export function AuthShell({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-6 py-12">
      <Logo className="mb-8" />
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <div className="mt-6">{children}</div>
      </div>
      <p className="mt-6 text-sm text-slate-600">{footer}</p>
    </div>
  );
}

export function Field({
  label,
  name,
  type,
  autoComplete,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
