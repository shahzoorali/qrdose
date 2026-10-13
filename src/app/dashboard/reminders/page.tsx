import { Suspense } from "react";
import { MedicationReminders } from "@/components/MedicationReminders";
import { GoogleCalendarSync } from "@/components/GoogleCalendarSync";

export default function RemindersPage() {
  return (
    <div className="space-y-8">
      <MedicationReminders />
      <Suspense fallback={null}>
        <GoogleCalendarSync />
      </Suspense>
    </div>
  );
}
