import { currentUser } from "@/lib/session";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const user = (await currentUser())!;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Account settings
        </h1>
        <p className="mt-1 text-slate-600">
          Update your name, email, phone, and timezone. Notification times use
          this timezone.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <SettingsForm
          initialName={user.name}
          initialTimezone={user.timezone}
          initialEmail={user.email}
          initialPhone={user.phone}
        />
      </div>
    </div>
  );
}
