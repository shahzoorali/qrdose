import { currentUser } from "@/lib/session";
import { formatUsPhone } from "@/lib/phone";
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
          Update your name and timezone. Notification times use this timezone.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <SettingsForm
          initialName={user.name}
          initialTimezone={user.timezone}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-medium text-slate-500">Account details</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Phone (for reset codes)</dt>
            <dd className="font-medium text-slate-900">
              {formatUsPhone(user.phone)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
