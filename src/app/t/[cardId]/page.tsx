import { Logo } from "@/components/Logo";
import { TriggerButton } from "@/components/TriggerButton";
import { resolveCard } from "@/lib/repositories/cards";
import { getUserById } from "@/lib/repositories/users";

export default async function TriggerPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const userId = await resolveCard(cardId);
  const user = userId ? await getUserById(userId) : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-6 py-12">
      <Logo className="mb-8" />
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {!user ? (
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">
              This card isn&apos;t active
            </h1>
            <p className="mt-2 text-slate-600">
              The link may have been regenerated. Check the card or contact the
              account owner.
            </p>
          </div>
        ) : (
          <>
            <p className="text-center text-sm font-medium text-slate-500">
              This will send:
            </p>
            <p className="mt-3 rounded-xl bg-slate-50 px-4 py-4 text-center text-lg font-medium text-slate-800">
              &ldquo;{user.notificationMessage} at [time].&rdquo;
            </p>
            <div className="mt-8">
              <TriggerButton cardId={cardId} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
