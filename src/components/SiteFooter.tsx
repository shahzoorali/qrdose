import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex flex-col items-center text-center">
          <Logo markClassName="h-16 w-auto" />
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            Powered by{" "}
            <a
              href="https://qridlok.com/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-700"
            >
              Qridlok Emergency Network
            </a>
          </p>
        </div>
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} QRdose.com
        </p>
      </div>
    </footer>
  );
}
