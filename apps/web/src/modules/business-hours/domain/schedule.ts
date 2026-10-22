import { demoHours } from "./demo-hours.ts";

export const weekdays = [
  "Måndag",
  "Tisdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lördag",
  "Söndag",
] as const;
export const timeKinds = ["opening", "sameDayOrdering"] as const;
export const timeLabels = {
  opening: "Öppet / hämtning",
  sameDayOrdering: "Sammadagsbeställning",
} as const;
export type TimeKind = (typeof timeKinds)[number];
export type Interval = { from: string; until: string } | null;
export type DayHours = Record<TimeKind, Interval>;
export type DateOverride = Partial<DayHours>;
export type Schedule = {
  version: 1;
  week: DayHours[];
  overrides: Record<string, DateOverride>;
};

// ADM-003: calendar arithmetic avoids local-machine timezone/DST drift.
export function isDate(value: string): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < "2000-01-01" ||
    value > "2199-12-31"
  )
    return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function addDays(value: string, count: number): string {
  if (!isDate(value) || !Number.isInteger(count))
    throw new Error("Ogiltigt datum.");
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
export function dayIndex(value: string): number {
  if (!isDate(value)) throw new Error("Ogiltigt datum.");
  return (new Date(`${value}T12:00:00Z`).getUTCDay() + 6) % 7;
}
export function weekDates(value: string): string[] {
  const monday = addDays(value, -dayIndex(value));
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}
export function stockholmDate(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function dateLabel(
  value: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" },
): string {
  return new Intl.DateTimeFormat("sv-SE", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
export function initialSchedule(): Schedule {
  return {
    version: 1,
    week: weekdays.map((_, index) => ({
      opening: index < 3 ? null : { ...demoHours.opening },
      sameDayOrdering: index < 3 ? null : { ...demoHours.sameDayOrdering },
    })),
    overrides: {},
  };
}
export function sameInterval(a: Interval, b: Interval): boolean {
  return a === null || b === null
    ? a === b
    : a.from === b.from && a.until === b.until;
}
export function effectiveDay(
  schedule: Schedule,
  date: string,
): { hours: DayHours; changed: Record<TimeKind, boolean> } {
  const standard = schedule.week[dayIndex(date)]!;
  const override = schedule.overrides[date];
  const hours = { ...standard, ...override };
  return {
    hours,
    changed: {
      opening: !sameInterval(hours.opening, standard.opening),
      sameDayOrdering: !sameInterval(
        hours.sameDayOrdering,
        standard.sameDayOrdering,
      ),
    },
  };
}
export function intervalLabel(value: Interval): string {
  return value ? `${value.from}–${value.until}` : "Stängt";
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function readInterval(value: unknown): Interval {
  if (value === null) return null;
  const validTime = (time: unknown): time is string =>
    typeof time === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
  if (
    !record(value) ||
    !validTime(value.from) ||
    !validTime(value.until) ||
    value.from >= value.until
  )
    throw new Error(
      "Ange giltiga tider där från är före till, inom samma dag.",
    );
  return { from: value.from, until: value.until };
}
function readDay(value: unknown, partial: boolean): DateOverride {
  if (
    !record(value) ||
    Object.keys(value).some((key) => !timeKinds.includes(key as TimeKind))
  )
    throw new Error("Ogiltiga tidstyper.");
  const result: DateOverride = {};
  for (const kind of timeKinds) {
    if (Object.hasOwn(value, kind)) result[kind] = readInterval(value[kind]);
    else if (!partial)
      throw new Error("Båda tidstyperna måste finnas i standardveckan.");
  }
  return result;
}
// OPPEN-007/009; ADM-002: local data is validated as untrusted input, atomically.
export function readSchedule(value: unknown): Schedule {
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.week) ||
    value.week.length !== 7 ||
    !record(value.overrides)
  )
    throw new Error("Ogiltigt sparat schema.");
  if (Object.keys(value.overrides).length > 2000)
    throw new Error("För många datumundantag.");
  const overrides: Record<string, DateOverride> = {};
  for (const [date, day] of Object.entries(value.overrides)) {
    if (!isDate(date))
      throw new Error("Ogiltigt datum. Välj ett datum mellan 2000 och 2199.");
    const parsed = readDay(day, true);
    if (Object.keys(parsed).length) overrides[date] = parsed;
  }
  return {
    version: 1,
    week: value.week.map((day) => readDay(day, false) as DayHours),
    overrides,
  };
}
