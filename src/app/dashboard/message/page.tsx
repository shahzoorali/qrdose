import { LogoMark } from "@/components/Logo";
import { currentUser } from "@/lib/session";
import { MessageForm } from "./MessageForm";

export default async function MessagePage() {
  const user = (await currentUser())!;
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left">
        <LogoMark className="h-20 w-auto sm:h-24" priority />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Notification message
          </h1>
          <p className="mt-1 text-slate-600">
            This is the message your contacts receive on every tap.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <MessageForm
          initial={user.notificationMessage}
          initialQuickPhrases={user.quickPhrases ?? []}
        />
      </div>
    </div>
  );
}
