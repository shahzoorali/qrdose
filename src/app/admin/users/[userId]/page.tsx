import { notFound } from "next/navigation";
import Link from "next/link";
import { currentAdmin } from "@/lib/admin";
import { getUserById } from "@/lib/repositories/users";
import { listContacts } from "@/lib/repositories/contacts";
import { listTriggers } from "@/lib/repositories/history";
import { toPublicUser } from "@/lib/types";
import { qrDataUrl, triggerUrl } from "@/lib/qrcode";
import { AdminUserForm } from "./AdminUserForm";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const admin = await currentAdmin();
  const { userId } = await params;

  const user = await getUserById(userId);
  if (!user) notFound();

  const [contacts, history, qr] = await Promise.all([
    listContacts(userId),
    listTriggers(userId),
    qrDataUrl(user.cardId),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← All users
      </Link>
      <AdminUserForm
        user={toPublicUser(user)}
        contacts={contacts}
        history={history}
        card={{ cardId: user.cardId, url: triggerUrl(user.cardId), qr }}
        isSelf={admin?.userId === userId}
      />
    </div>
  );
}
