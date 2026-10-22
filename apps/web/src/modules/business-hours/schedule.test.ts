import assert from "node:assert/strict";
import test from "node:test";
import {
  initialSchedule,
  readSchedule,
  effectiveDay,
  weekDates,
  stockholmDate,
  isDate,
} from "./domain/schedule.ts";

test("OPPEN-007/009: each type inherits independently; equal overrides do not count as changed", () => {
  const schedule = initialSchedule();
  schedule.overrides["2026-10-22"] = { opening: null };
  assert.deepEqual(effectiveDay(schedule, "2026-10-22"), {
    hours: {
      opening: null,
      sameDayOrdering: { from: "10:30", until: "14:00" },
    },
    changed: { opening: true, sameDayOrdering: false },
  });
  schedule.overrides["2026-10-22"] = {
    opening: { from: "11:00", until: "15:00" },
  };
  assert.equal(effectiveDay(schedule, "2026-10-22").changed.opening, false);
  schedule.week[3]!.sameDayOrdering = null;
  assert.equal(
    effectiveDay(schedule, "2026-10-22").hours.sameDayOrdering,
    null,
  );
  assert.equal(
    effectiveDay(schedule, "2026-10-22").hours.opening?.from,
    "11:00",
  );
});

test("ADM-003: Stockholm date and Monday weeks across year and DST boundaries", () => {
  assert.equal(stockholmDate(new Date("2026-10-21T22:30:00Z")), "2026-10-22");
  assert.equal(stockholmDate(new Date("2026-12-31T23:30:00Z")), "2027-01-01");
  assert.deepEqual(weekDates("2027-01-01"), [
    "2026-12-28",
    "2026-12-29",
    "2026-12-30",
    "2026-12-31",
    "2027-01-01",
    "2027-01-02",
    "2027-01-03",
  ]);
  assert.deepEqual(weekDates("2026-10-25").slice(-2), [
    "2026-10-24",
    "2026-10-25",
  ]);
  assert.equal(isDate("2028-02-29"), true);
  assert.equal(isDate("2026-02-29"), false);
});

test("ADM-002/003: reject invalid local schedules without accepting partial data", () => {
  assert.deepEqual(readSchedule(initialSchedule()), initialSchedule());
  for (const interval of [
    { from: "25:00", until: "26:00" },
    { from: "15:00", until: "11:00" },
    { from: "11:00", until: "11:00" },
    { from: "1:00", until: "15:00" },
    undefined,
  ]) {
    const schedule = initialSchedule();
    Object.assign(schedule.week[0]!, { opening: interval });
    assert.throws(() => readSchedule(schedule));
  }
  const schedule = initialSchedule();
  schedule.overrides["2026-02-30"] = { opening: null };
  assert.throws(() => readSchedule(schedule));
  assert.throws(() => readSchedule({ ...initialSchedule(), week: [] }));
  assert.throws(() => readSchedule({ ...initialSchedule(), version: 2 }));
});
