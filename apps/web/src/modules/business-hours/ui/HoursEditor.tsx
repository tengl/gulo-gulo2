"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/shared/Sheet";
import {
  weekdays,
  timeKinds,
  timeLabels,
  readSchedule,
  dayIndex,
  isDate,
  intervalLabel,
  demoHours,
  type Schedule,
  type Interval,
  type DateOverride,
} from "../index";

function TimeFields({
  prefix,
  value,
  inherit,
  standard,
  fallback,
}: {
  prefix: string;
  value: Interval | undefined;
  inherit?: boolean;
  standard?: Interval;
  fallback: NonNullable<Interval>;
}) {
  const [mode, setMode] = useState(
    value === undefined ? "standard" : value === null ? "closed" : "custom",
  );
  return (
    <div className="admin-time-fields">
      <select
        aria-label="Tidsval"
        name={`${prefix}-mode`}
        value={mode}
        onChange={(event) => setMode(event.target.value)}
      >
        {inherit && (
          <option value="standard">
            Standard
            {standard !== undefined ? ` · ${intervalLabel(standard)}` : ""}
          </option>
        )}
        <option value="custom">Egna tider</option>
        <option value="closed">Stängt</option>
      </select>
      {mode === "custom" && (
        <div className="admin-time-pair">
          <label>
            Från
            <input
              type="time"
              name={`${prefix}-from`}
              defaultValue={value?.from ?? standard?.from ?? fallback.from}
              required
            />
          </label>
          <span aria-hidden="true">–</span>
          <label>
            Till
            <input
              type="time"
              name={`${prefix}-until`}
              defaultValue={value?.until ?? standard?.until ?? fallback.until}
              required
            />
          </label>
        </div>
      )}
    </div>
  );
}

function readFields(data: FormData, prefix: string): Interval | undefined {
  const mode = data.get(`${prefix}-mode`);
  if (mode === "standard") return undefined;
  if (mode === "closed") return null;
  return {
    from: String(data.get(`${prefix}-from`) ?? ""),
    until: String(data.get(`${prefix}-until`) ?? ""),
  };
}

export function HoursEditor({
  schedule,
  date,
  save,
  onClose,
}: {
  schedule: Schedule;
  date: string | null;
  save: (schedule: Schedule) => Promise<void>;
  onClose: () => void;
}) {
  // Capture the starting revision: a change in another tab must never overwrite it silently.
  const [original] = useState(schedule);
  const [selectedDate, setSelectedDate] = useState(date ?? "");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isStandard = date === null;
  function close() {
    if (!busy && (!dirty || window.confirm("Kasta osparade ändringar?")))
      onClose();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const next = structuredClone(original);
      if (isStandard) {
        next.week = weekdays.map((_, index) => ({
          opening: readFields(data, `${index}-opening`)!,
          sameDayOrdering: readFields(data, `${index}-sameDayOrdering`)!,
        }));
      } else {
        if (!isDate(selectedDate))
          throw new Error("Välj ett giltigt datum mellan 2000 och 2199.");
        const override: DateOverride = {};
        for (const kind of timeKinds) {
          const value = readFields(data, kind);
          if (value !== undefined) override[kind] = value;
        }
        // Both inherited removes the exception; null explicitly closes just that type.
        delete next.overrides[selectedDate];
        if (Object.keys(override).length)
          next.overrides[selectedDate] = override;
      }
      await save(readSchedule(next));
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kunde inte spara.");
      setBusy(false);
    }
  }
  const standard = isDate(selectedDate)
    ? original.week[dayIndex(selectedDate)]
    : undefined;
  return (
    <Sheet
      title={isStandard ? "Redigera standardvecka" : "Datumundantag"}
      onClose={close}
    >
      <div className="admin-scope admin-editor">
        <span className="eyebrow">Lokal förhandsvisning</span>
        <h2>{isStandard ? "Din standardvecka" : "Tider för ett datum"}</h2>
        <p>
          {isStandard
            ? "Gäller dagar som saknar ett eget datumundantag."
            : "Välj vad som ska avvika. De två tidstyperna kan ändras var för sig."}
        </p>
        <form
          onSubmit={submit}
          onChange={(event) => {
            // Choosing which date to edit is not itself an unsaved edit.
            if ((event.target as HTMLElement).dataset.selectsDate === undefined)
              setDirty(true);
          }}
        >
          <fieldset disabled={busy} className="admin-form-body">
            {!isStandard && (
              <label className="admin-date-input">
                Datum
                <input
                  type="date"
                  data-selects-date=""
                  value={selectedDate}
                  min="2000-01-01"
                  max="2199-12-31"
                  required
                  onChange={(event) => {
                    if (
                      !dirty ||
                      window.confirm("Byta datum och kasta osparade tider?")
                    )
                      setSelectedDate(event.target.value);
                  }}
                />
              </label>
            )}
            {isStandard
              ? weekdays.map((day, index) => (
                  <fieldset className="admin-day-editor" key={day}>
                    <legend>{day}</legend>
                    {timeKinds.map((kind) => (
                      <fieldset className="admin-kind-editor" key={kind}>
                        <legend>{timeLabels[kind]}</legend>
                        <TimeFields
                          prefix={`${index}-${kind}`}
                          value={original.week[index]![kind]}
                          fallback={demoHours[kind]}
                        />
                      </fieldset>
                    ))}
                  </fieldset>
                ))
              : selectedDate && (
                  <div key={selectedDate}>
                    {timeKinds.map((kind) => (
                      <fieldset className="admin-kind-editor" key={kind}>
                        <legend>{timeLabels[kind]}</legend>
                        <TimeFields
                          prefix={kind}
                          value={original.overrides[selectedDate]?.[kind]}
                          standard={standard?.[kind]}
                          fallback={demoHours[kind]}
                          inherit
                        />
                      </fieldset>
                    ))}
                  </div>
                )}
          </fieldset>
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
          <p className="admin-save-note">
            Sparas bara på den här enheten. Kundvyn och Google påverkas inte.
          </p>
          <div className="admin-actions">
            <button
              type="button"
              className="admin-secondary"
              onClick={close}
              disabled={busy}
            >
              Avbryt
            </button>
            <button
              className="admin-primary"
              disabled={busy || (!isStandard && !selectedDate)}
            >
              {busy ? "Sparar…" : "Spara lokalt"}
            </button>
          </div>
        </form>
      </div>
    </Sheet>
  );
}
