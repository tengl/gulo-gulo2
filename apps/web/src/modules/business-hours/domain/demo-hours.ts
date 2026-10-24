// OPPEN-016/017: display-only ordinary hours from the legacy UI, not slot availability.
export const demoHours = {
  days: "tors–sön",
  // Monday is 0, as in schedule.ts; must match `days` above.
  weekdays: [3, 4, 5, 6],
  opening: { from: "11:00", until: "15:00" },
  sameDayOrdering: { from: "10:30", until: "14:00" },
} as const;

export const ordinaryHoursText = `Ordinarie öppettider: ${demoHours.days} ${demoHours.opening.from}–${demoHours.opening.until}. Beställ för samma dag: ${demoHours.days} ${demoHours.sameDayOrdering.from}–${demoHours.sameDayOrdering.until}. Övriga tider blir det en förbeställning. Det här är demotider, inte uppgift om bokningsbara hämtningstider eller datumundantag.`;

// WEBB-009/010: today's status for the website, in Stockholm time.
export type OpeningStatus =
  | { kind: "open"; until: string }
  | { kind: "later"; from: string }
  | { kind: "closed-today" }
  | { kind: "closed-for-the-day" };

export function openingStatus(now: Date): OpeningStatus {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Stockholm",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(
    part("weekday"),
  );
  const time = `${part("hour")}:${part("minute")}`;
  const { opening } = demoHours;
  if (!(demoHours.weekdays as readonly number[]).includes(weekday))
    return { kind: "closed-today" };
  if (time < opening.from) return { kind: "later", from: opening.from };
  if (time < opening.until) return { kind: "open", until: opening.until };
  return { kind: "closed-for-the-day" };
}
