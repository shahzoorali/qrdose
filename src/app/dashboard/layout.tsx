import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { DashboardNav } from "@/components/DashboardNav";
import { SignOutButton } from "@/components/SignOutButton";
import { currentUser } from "@/lib/session";
import { isAccountDisabled } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  // A disabled account with a still-valid session is bounced out.
  if (isAccountDisabled(user)) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center justify-between py-4">
            <Logo />
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-slate-500 sm:block">
                {user.name}
              </span>
              <SignOutButton />
            </div>
          </div>
          <div className="pb-3">
            <DashboardNav isAdmin={user.isAdmin === true} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
