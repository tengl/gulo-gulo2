"use client";

import { useId, useState, type RefObject } from "react";
import type { LinkTarget } from "../domain/site";

// WEBB-016: links are chosen from the site's real pages instead of typed, so a
// staff member does not need to know the addresses or the Markdown syntax.
const other = "annan";

export function LinkInserter({
  targets,
  field,
  onInsert,
}: {
  targets: readonly LinkTarget[];
  field: RefObject<HTMLTextAreaElement | null>;
  onInsert: (text: string, cursor: number) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [text, setText] = useState("");
  const [target, setTarget] = useState(targets[0]?.href ?? "");
  const [address, setAddress] = useState("https://");
  const [problem, setProblem] = useState("");
  const groups = [...new Set(targets.map((entry) => entry.group))];

  function start() {
    const area = field.current;
    const from = area?.selectionStart ?? 0;
    const to = area?.selectionEnd ?? from;
    setRange([from, to]);
    setText(area ? area.value.slice(from, to).trim() : "");
    setProblem("");
    setOpen(true);
  }

  function insert() {
    const href = target === other ? address.trim() : target;
    if (!text.trim()) return setProblem("Skriv texten som ska bli en länk.");
    if (target === other && !/^https:\/\/[^\s/]+\.[^\s]+$/.test(href))
      return setProblem("Skriv hela adressen, till exempel https://www.instagram.com/gulogulo.");
    const area = field.current;
    const value = area?.value ?? "";
    const link = `[${text.trim().replace(/[[\]]/g, "\\$&")}](${href})`;
    const [from, to] = range;
    onInsert(value.slice(0, from) + link + value.slice(to), from + link.length);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="admin-secondary texts-link-button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => (open ? setOpen(false) : start())}
      >
        Infoga länk
      </button>
      {open && (
        <div id={id} role="group" aria-label="Infoga länk" className="texts-link">
          <div className="texts-field">
            <label htmlFor={`${id}-text`}>Länktext</label>
            <input id={`${id}-text`} value={text} onChange={(event) => setText(event.target.value)} />
          </div>
          <div className="texts-field">
            <label htmlFor={`${id}-target`}>Länka till</label>
            <select id={`${id}-target`} value={target} onChange={(event) => setTarget(event.target.value)}>
              {groups.map((group) => (
                <optgroup key={group} label={group}>
                  {targets
                    .filter((entry) => entry.group === group)
                    .map((entry) => (
                      <option key={entry.href} value={entry.href}>
                        {entry.label}
                      </option>
                    ))}
                </optgroup>
              ))}
              <option value={other}>En annan webbplats…</option>
            </select>
          </div>
          {target === other && (
            <div className="texts-field">
              <label htmlFor={`${id}-address`}>Webbadress</label>
              <input
                id={`${id}-address`}
                type="url"
                inputMode="url"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>
          )}
          {problem && (
            <p role="alert" className="admin-error">
              {problem}
            </p>
          )}
          <div className="admin-actions">
            <button type="button" className="admin-secondary" onClick={() => setOpen(false)}>
              Avbryt
            </button>
            <button type="button" className="admin-primary" onClick={insert}>
              Infoga
            </button>
          </div>
        </div>
      )}
    </>
  );
}
