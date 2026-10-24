"use client";

import { useRef, useState } from "react";
import { Icon } from "@/shared/Icon";
import { SheetPresence } from "@/shared/Sheet";
import {
  weekdays,
  timeKinds,
  timeLabels,
  initialSchedule,
  effectiveDay,
  weekDates,
  addDays,
  dayIndex,
  dateLabel,
  intervalLabel,
  type Schedule,
} from "../index";
import { HoursEditor } from "./HoursEditor";
import { useSchedulePreview } from "./useSchedulePreview";

export function HoursAdmin({ today }: { today: string }) {
  const { schedule, error, save } = useSchedulePreview();
  const [anchor, setAnchor] = useState(today);
  const [editor, setEditor] = useState<{ date: string | null } | null>(null);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  // Keep the save closure tied to the editor's initial storage revision.
  const editorSave = useRef(save);
  const dates = weekDates(anchor);
  function edit(date: string | null) {
    editorSave.current = save;
    setEditor({ date });
    setMessage("");
  }
  async function saveEditor(next: Schedule) {
    await editorSave.current(next);
    setMessage(
      "Sparat som lokal förhandsvisning. Kundvyn och Google är oförändrade.",
    );
  }
  async function reset() {
    if (
      !window.confirm(
        "Återställ alla lokala tider och datumundantag till demotiderna?",
      )
    )
      return;
    setBusy(true);
    setActionError("");
    setMessage("");
    try {
      await save(initialSchedule(), true);
      setMessage("Den lokala förhandsvisningen är återställd.");
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Kunde inte återställa.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-page-title">
        <div>
          <span className="eyebrow">Planera & justera</span>
          <h1>Öppettider</h1>
          <p>En standardvecka. Utrymme för det som ändras.</p>
        </div>
        <button
          className="admin-secondary"
          onClick={() => edit(null)}
          disabled={Boolean(error)}
        >
          <Icon name="write" />
          Redigera standardvecka
        </button>
      </div>
      <aside className="admin-notice">
        <span className="admin-status-dot" />
        <div>
          <strong>Lokal förhandsvisning</strong>
          <p>
            Du provar administrationen. Ändringar sparas i den här webbläsaren
            och påverkar ännu inte kunderna eller Google.
          </p>
        </div>
      </aside>
      {(error || actionError) && (
        <p className="admin-error" role="alert">
          {error || actionError}
          {error && " Demotider visas tills lagringen återställs."}
        </p>
      )}
      {message && (
        <p className="admin-success" role="status">
          {message}
        </p>
      )}
      <section className="admin-week" aria-label="Veckans tider">
        <div className="admin-section-head">
          <div>
            <span className="eyebrow">Veckoöversikt · Stockholm</span>
            <h2>
              {dateLabel(dates[0]!)} –{" "}
              {dateLabel(dates[6]!, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>
          <div className="admin-week-nav">
            <button
              aria-label="Föregående vecka"
              disabled={dates[0]! <= "2000-01-10"}
              onClick={() => setAnchor(addDays(anchor, -7))}
            >
              ←
            </button>
            <button onClick={() => setAnchor(today)}>Denna vecka</button>
            <button
              aria-label="Nästa vecka"
              disabled={dates[6]! >= "2199-12-20"}
              onClick={() => setAnchor(addDays(anchor, 7))}
            >
              →
            </button>
          </div>
        </div>
        <div className="admin-week-legend">
          <span>
            <span className="admin-change-dot" /> Avviker från standardveckan
          </span>
          <span>Öppet gäller även hämtning.</span>
        </div>
        <div className="admin-day-list">
          {dates.map((date) => {
            const { hours, changed } = effectiveDay(schedule, date);
            const standard = schedule.week[dayIndex(date)]!;
            return (
              <article
                className={`admin-day${date === today ? " is-today" : ""}`}
                key={date}
                aria-label={`${weekdays[dayIndex(date)]} ${dateLabel(date)}`}
              >
                <div className="admin-day-date">
                  <strong>{weekdays[dayIndex(date)]}</strong>
                  <span>{dateLabel(date)}</span>
                  {date === today && <small>Idag</small>}
                </div>
                {timeKinds.map((kind) => (
                  <div
                    className={`admin-day-time${changed[kind] ? " is-changed" : ""}`}
                    key={kind}
                  >
                    <span>{timeLabels[kind]}</span>
                    <strong>
                      {intervalLabel(hours[kind])}
                      {changed[kind] && <small>Ändrad</small>}
                    </strong>
                    {changed[kind] && (
                      <span>Standard: {intervalLabel(standard[kind])}</span>
                    )}
                  </div>
                ))}
                <button
                  className="admin-edit-day"
                  onClick={() => edit(date)}
                  disabled={Boolean(error)}
                  aria-label={`Ändra ${weekdays[dayIndex(date)]} ${dateLabel(date)}`}
                >
                  <Icon name="write" />
                  <span>Ändra</span>
                </button>
              </article>
            );
          })}
        </div>
        <p className="admin-footnote">
          Sammadagsbeställning är tiden då en beställning för samma dag får
          läggas. Utanför fönstret blir det en förbeställning.
        </p>
      </section>
      <section className="admin-exceptions" aria-labelledby="exceptions-title">
        <div className="admin-section-head">
          <div>
            <span className="eyebrow">När veckan ser annorlunda ut</span>
            <h2 id="exceptions-title">Datumundantag</h2>
          </div>
          <button
            className="admin-secondary"
            disabled={Boolean(error)}
            onClick={() => edit(today)}
          >
            <Icon name="plus" />
            Lägg till datumundantag
          </button>
        </div>
        {Object.keys(schedule.overrides).length === 0 ? (
          <div className="admin-empty">
            <Icon name="clock" size={28} />
            <div>
              <strong>Standardveckan gäller alla dagar</strong>
              <p>
                Lägg till ett datum för till exempel en helgdag eller en
                tillfällig ändring.
              </p>
            </div>
          </div>
        ) : (
          <ul className="admin-exception-list">
            {Object.keys(schedule.overrides)
              .sort()
              .map((date) => (
                <li key={date}>
                  <div>
                    <strong>
                      {dateLabel(date, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </strong>
                    <span>
                      {timeKinds
                        .map(
                          (kind) =>
                            `${timeLabels[kind]}: ${schedule.overrides[date]![kind] === undefined ? "standard" : intervalLabel(schedule.overrides[date]![kind]!)}`,
                        )
                        .join(" · ")}
                    </span>
                  </div>
                  <button
                    className="admin-secondary"
                    onClick={() => edit(date)}
                    disabled={Boolean(error)}
                    aria-label={`Redigera undantag ${date}`}
                  >
                    Redigera
                  </button>
                </li>
              ))}
          </ul>
        )}
      </section>
      <div className="admin-bottom-note">
        <p>
          Demotiderna är utgångspunkt. Det här är ingen kontroll av kapacitet
          eller bokningsbara tider.
        </p>
        <button className="admin-reset" onClick={reset} disabled={busy}>
          Återställ lokal förhandsvisning
        </button>
      </div>
      <SheetPresence>
        {editor && (
          <HoursEditor
            schedule={schedule}
            date={editor.date}
            save={saveEditor}
            onClose={() => setEditor(null)}
          />
        )}
      </SheetPresence>
    </>
  );
}
