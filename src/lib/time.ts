/**
 * Timezone helpers for medication scheduling.
 *
 * Medication times are stored as local wall-clock strings ("08:00") because
 * that's what the user means — 8 AM stays 8 AM across a DST change. Turning
 * those into real instants requires resolving the zone offset that applies on
 * the specific date, which is what these helpers do without pulling in a
 * date library.
 */

/** Milliseconds to add to a UTC instant to get the wall-clock time in `tz`. */
function zoneOffsetMs(instant: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(instant);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  // Intl renders midnight as hour 24 in some environments; normalize it.
  const hour = get("hour") % 24;

  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    hour,
    get("minute"),
    get("second")
  );
  return asUtc - instant.getTime();
}

/** Local calendar date in `tz` as "YYYY-MM-DD". */
export function localDateString(instant: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
  // en-CA already formats as YYYY-MM-DD.
  return parts;
}

/**
 * The UTC instant for a local wall-clock time in `tz`.
 *
 * Solved by iteration: guess that the wall-clock time is UTC, measure the
 * offset that actually applies near that instant, correct, then repeat once so
 * a DST transition between the guess and the answer converges.
 */
export function zonedTimeToUtc(
  date: string, // YYYY-MM-DD
  time: string, // HH:mm
  tz: string
): Date {
  const target = Date.parse(`${date}T${time}:00Z`);
  if (Number.isNaN(target)) {
    throw new Error(`Invalid local datetime: ${date} ${time}`);
  }

  let instant = new Date(target);
  for (let i = 0; i < 2; i++) {
    instant = new Date(target - zoneOffsetMs(instant, tz));
  }
  return instant;
}

/** Human-readable time for message bodies, e.g. "8:00 AM". */
export function formatTimeOfDay(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** The previous calendar day for a "YYYY-MM-DD" string. */
export function previousDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
