import { currentUser } from "@/lib/session";
import { MessageForm } from "./MessageForm";

export default async function MessagePage() {
  const user = (await currentUser())!;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Notification message
        </h1>
        <p className="mt-1 text-slate-600">
          This is the single message your contacts receive on every tap.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <MessageForm initial={user.notificationMessage} />
      </div>
    </div>
  );
}
