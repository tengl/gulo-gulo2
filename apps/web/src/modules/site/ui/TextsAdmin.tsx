"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/shared/Icon";
import { useHydrated } from "@/shared/useHydrated";
import type { ContentField } from "../domain/content-edit";
import { Prose } from "./Prose";

// WEBB-015–018: staff edit the site's texts here. A save is a commit in the
// repository, made with their own GitHub account.

export type TextFile = { file: string; title: string; group: string };

type Opened = {
  file: string;
  sha: string;
  base: string;
  fields: ContentField[];
  body: string;
  version?: string;
};
type Version = { commit: string; date: string; author: string; message: string };
type Answer = {
  error?: string;
  problems?: string[];
  conflict?: boolean;
  signedOut?: boolean;
};

const dateFormat = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  dateStyle: "medium",
  timeStyle: "short",
});

async function call<T>(input: string, init?: RequestInit): Promise<T & Answer> {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => null)) as (T & Answer) | null;
  if (body?.signedOut) window.location.reload();
  if (!response.ok || !body)
    throw Object.assign(new Error(body?.error ?? "Kunde inte nå servern. Försök igen."), {
      answer: body ?? {},
    });
  return body;
}

function failure(cause: unknown): Answer {
  const answer = (cause as { answer?: Answer }).answer ?? {};
  return {
    ...answer,
    error: cause instanceof Error ? cause.message : "Något gick fel. Försök igen.",
  };
}

export function TextsAdmin({
  editor,
  files,
  githubFiles,
}: {
  editor: { login: string; name: string };
  files: readonly TextFile[];
  githubFiles: string;
}) {
  const ready = useHydrated();
  const [opened, setOpened] = useState<Opened | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"" | "opening" | "saving" | "history">("");
  const [problem, setProblem] = useState<Answer>({});
  const [saved, setSaved] = useState<{ url: string | null } | null>(null);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const changed =
    opened !== null &&
    (body !== opened.body ||
      opened.version !== undefined ||
      opened.fields.some((field) => values[field.id] !== field.value));

  useEffect(() => {
    if (!changed) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed]);

  function show(next: Opened) {
    setOpened(next);
    setValues(Object.fromEntries(next.fields.map((field) => [field.id, field.value])));
    setBody(next.body);
    setProblem({});
    setLeaving(null);
    requestAnimationFrame(() => heading.current?.focus());
  }

  async function open(file: string, version?: string) {
    setBusy("opening");
    setSaved(null);
    setVersions(null);
    setNote("");
    try {
      const query = new URLSearchParams({ fil: file, ...(version ? { version } : {}) });
      const result = await call<Omit<Opened, "file">>(`/api/admin/content?${query}`);
      show({ file, sha: result.sha, base: result.base, fields: result.fields, body: result.body, version });
    } catch (cause) {
      setProblem(failure(cause));
    } finally {
      setBusy("");
    }
  }

  function choose(file: string | null) {
    if (changed) {
      setLeaving(file ?? "");
      return;
    }
    if (file) void open(file);
    else {
      setOpened(null);
      setProblem({});
      setSaved(null);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!opened || !changed) return;
    setBusy("saving");
    setProblem({});
    setSaved(null);
    try {
      const result = await call<Omit<Opened, "file"> & { url: string | null }>(
        "/api/admin/content",
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fil: opened.file, sha: opened.sha, base: opened.base, values, body, note }),
        },
      );
      // The saved file is the new version; the next save builds on it.
      setOpened({
        file: opened.file,
        sha: result.sha,
        base: result.base,
        fields: result.fields,
        body: result.body,
      });
      setNote("");
      setVersions(null);
      setSaved({ url: result.url });
    } catch (cause) {
      setProblem(failure(cause));
    } finally {
      setBusy("");
    }
  }

  async function showHistory() {
    if (!opened) return;
    setBusy("history");
    try {
      const result = await call<{ versions: Version[] }>(
        `/api/admin/content/history?${new URLSearchParams({ fil: opened.file })}`,
      );
      setVersions(result.versions);
    } catch (cause) {
      setProblem(failure(cause));
    } finally {
      setBusy("");
    }
  }

  async function logout() {
    await fetch("/api/admin/github/session", { method: "DELETE" }).catch(() => null);
    window.location.reload();
  }

  const current = files.find((entry) => entry.file === opened?.file);
  const groups = [...new Set(files.map((entry) => entry.group))];
  const field = (name: string) => values[name];
  const title = field("rubrik") ?? field("namn") ?? current?.title ?? "";
  const lead = field("ingress") ?? field("slogan");

  return (
    <div className="texts-admin admin-scope" inert={!ready}>
      <header className="texts-topbar">
        <Link className="admin-brand" href="/admin">
          <Image src="/logo-light.png" alt="Gulo Gulo" width={44} height={44} />
          <span>
            GULO GULO<small>Webbplatsens texter</small>
          </span>
        </Link>
        <span className="texts-user">
          {editor.name} <small>@{editor.login} på GitHub</small>
        </span>
        <button type="button" onClick={logout}>
          Logga ut
        </button>
      </header>
      <div className="texts-layout" data-open={opened ? "" : undefined}>
        <nav aria-label="Texter" className="texts-files">
          {groups.map((group) => (
            <section key={group}>
              <h2>{group}</h2>
              <ul>
                {files
                  .filter((entry) => entry.group === group)
                  .map((entry) => (
                    <li key={entry.file}>
                      <button
                        type="button"
                        aria-current={opened?.file === entry.file ? "page" : undefined}
                        disabled={busy === "opening"}
                        onClick={() => choose(entry.file)}
                      >
                        {entry.title}
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </nav>
        <main className="texts-main">
          {leaving !== null && (
            <div className="admin-notice texts-leave" role="alert">
              <div>
                <strong>Du har ändringar som inte är sparade.</strong>
                <p>Spara dem först, eller släng dem och fortsätt.</p>
                <div className="admin-actions">
                  <button type="button" className="admin-secondary" onClick={() => setLeaving(null)}>
                    Fortsätt redigera
                  </button>
                  <button
                    type="button"
                    className="admin-primary"
                    onClick={() => {
                      const target = leaving;
                      setLeaving(null);
                      if (target) void open(target);
                      else setOpened(null);
                    }}
                  >
                    Släng ändringarna
                  </button>
                </div>
              </div>
            </div>
          )}
          {!opened ? (
            <div className="texts-intro">
              <span className="eyebrow">Webbplatsen</span>
              <h1>Texter</h1>
              <p>
                Välj en text att ändra. När du sparar hamnar ändringen i GitHub i
                ditt namn, och webbplatsen visar den efter nästa bygge, normalt
                inom några minuter.
              </p>
              <p>
                Priser, meny och öppettider ändras inte här. Bilder, nya sidor och
                nya rader i produktfakta görs än så länge på GitHub eller av en agent.
              </p>
              {busy === "opening" && <p role="status">Hämtar texten…</p>}
              {problem.error && (
                <p role="alert" className="admin-error">
                  {problem.error}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={save} className="texts-editor" aria-busy={busy !== ""}>
              <button type="button" className="texts-back" onClick={() => choose(null)}>
                <Icon name="arrow" size={14} /> Alla texter
              </button>
              <span className="eyebrow">{current?.group}</span>
              <h1 tabIndex={-1} ref={heading}>
                {current?.title}
              </h1>
              <p className="texts-source">
                Fil:{" "}
                <a href={`${githubFiles}/${opened.file}`} target="_blank" rel="noopener">
                  {opened.file}
                </a>
              </p>
              {opened.version && (
                <div className="admin-notice" role="status">
                  <div>
                    <strong>Du tittar på en tidigare version.</strong>
                    <p>Spara för att återställa den, eller välj texten igen för att ångra.</p>
                  </div>
                </div>
              )}
              <div className="texts-fields">
                {opened.fields.map((entry) => {
                  const id = `text-${entry.id}`;
                  return (
                    <div key={entry.id} className="texts-field">
                      <label htmlFor={id}>{entry.label}</label>
                      {entry.long ? (
                        <textarea
                          id={id}
                          rows={3}
                          value={values[entry.id] ?? ""}
                          onChange={(event) => setValues({ ...values, [entry.id]: event.target.value })}
                        />
                      ) : (
                        <input
                          id={id}
                          value={values[entry.id] ?? ""}
                          onChange={(event) => setValues({ ...values, [entry.id]: event.target.value })}
                        />
                      )}
                    </div>
                  );
                })}
                {opened.file !== "webbplats.md" && (
                  <div className="texts-field">
                    <label htmlFor="text-body">Brödtext</label>
                    <textarea
                      id="text-body"
                      className="texts-body"
                      rows={16}
                      value={body}
                      aria-describedby="text-body-help"
                      onChange={(event) => setBody(event.target.value)}
                    />
                    <small id="text-body-help">
                      Tom rad mellan stycken. ## före en rubrik, - före en punkt,
                      **fet text** och [länktext](/om) för en länk.
                    </small>
                  </div>
                )}
                <div className="texts-field">
                  <label htmlFor="text-note">Vad har du ändrat? (valfritt)</label>
                  <input
                    id="text-note"
                    value={note}
                    maxLength={500}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>
              </div>
              {problem.error && (
                <div role="alert" className="admin-error texts-problem">
                  <p>{problem.error}</p>
                  {problem.problems && (
                    <ul>
                      {problem.problems.map((entry) => (
                        <li key={entry}>{entry}</li>
                      ))}
                    </ul>
                  )}
                  {problem.conflict && (
                    <button type="button" className="admin-secondary" onClick={() => void open(opened.file)}>
                      Öppna den nya versionen
                    </button>
                  )}
                </div>
              )}
              {saved && (
                <p role="status" className="admin-success">
                  Sparat i GitHub. Webbplatsen visar ändringen efter nästa bygge,
                  normalt inom några minuter.{" "}
                  {saved.url && (
                    <a href={saved.url} target="_blank" rel="noopener">
                      Visa ändringen
                    </a>
                  )}
                </p>
              )}
              <div className="admin-actions texts-actions">
                <button
                  type="button"
                  className="admin-secondary"
                  disabled={busy !== ""}
                  onClick={showHistory}
                >
                  {busy === "history" ? "Hämtar…" : "Tidigare versioner"}
                </button>
                <button
                  type="button"
                  className="admin-secondary"
                  disabled={!changed || busy !== ""}
                  onClick={() => (opened.version ? void open(opened.file) : show(opened))}
                >
                  Ångra ändringarna
                </button>
                <button className="admin-primary" disabled={!changed || busy !== ""}>
                  {busy === "saving" ? "Sparar…" : "Spara och publicera"}
                </button>
              </div>
              {versions && (
                <section className="texts-history" aria-labelledby="texts-history">
                  <h2 id="texts-history">Tidigare versioner</h2>
                  <ol>
                    {versions.map((version, index) => (
                      <li key={version.commit}>
                        <div>
                          <strong>
                            {version.date ? dateFormat.format(new Date(version.date)) : "Okänt datum"}
                          </strong>{" "}
                          · {version.author}
                          <small>{version.message}</small>
                        </div>
                        {index === 0 ? (
                          <span className="admin-pill">Gällande</span>
                        ) : (
                          <button
                            type="button"
                            className="admin-secondary"
                            onClick={() => void open(opened.file, version.commit)}
                          >
                            Öppna
                          </button>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
              {opened.file !== "webbplats.md" && (
                <section className="texts-preview" aria-labelledby="texts-preview">
                  <h2 id="texts-preview">Förhandsvisning</h2>
                  <h3 className="texts-preview-title">{title}</h3>
                  {lead && <p className="texts-preview-lead">{lead}</p>}
                  <Prose markdown={body} />
                </section>
              )}
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
