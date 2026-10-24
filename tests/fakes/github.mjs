// A small stand-in for GitHub used by the browser tests (WEBB-015–018). It
// answers the few OAuth and REST calls admin makes. Each sign-in code gets its
// own copy of the repository, so parallel tests never see each other's commits.
import { createHash, randomBytes } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";

const port = Number(process.env.FAKE_GITHUB_PORT ?? 3101);
const repo = "gulo/test";
const root = "apps/web/content";
const source = join(import.meta.dirname, "../../apps/web/content");
const seed = [
  "webbplats.md",
  ...readdirSync(join(source, "sidor")).map((file) => `sidor/${file}`),
  ...readdirSync(join(source, "produkter")).map((file) => `produkter/${file}`),
].map((file) => [`${root}/${file}`, readFileSync(join(source, file), "utf8")]);

const blob = (raw) =>
  createHash("sha1").update(`blob ${Buffer.byteLength(raw)}\0${raw}`).digest("hex");
const commitSha = () => randomBytes(20).toString("hex");
const repos = new Map();

function repoFor(token) {
  if (!repos.has(token)) {
    const files = new Map(seed);
    const commits = seed.map(([path, raw]) => ({
      sha: commitSha(),
      path,
      raw,
      login: "tengl",
      date: "2026-10-24T08:00:00Z",
      message: "Move the Gulo Gulo website into the app",
    }));
    repos.set(token, { files, commits });
  }
  return repos.get(token);
}

// Tokens are "token-<code>"; codes starting with "editor" may write.
const person = (token) =>
  token.startsWith("token-editor")
    ? { login: "redaktor", name: "Rut Redaktör", push: true }
    : { login: "lasare", name: "", push: false };

function send(response, status, body, headers = {}) {
  response.writeHead(status, { "content-type": "application/json", ...headers });
  response.end(body === undefined ? "" : JSON.stringify(body));
}

async function read(request) {
  let text = "";
  for await (const chunk of request) text += chunk;
  return text ? JSON.parse(text) : {};
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  const token = request.headers.authorization?.replace(/^Bearer /, "") ?? "";
  const path = url.pathname;
  if (path === "/__health") return send(response, 200, { ok: true });
  if (path === "/login/oauth/authorize") {
    const back = new URL(url.searchParams.get("redirect_uri"));
    // A test picks its own sign-in code with a cookie on this host.
    const chosen = /(?:^|;\s*)fake-github-code=([\w-]+)/.exec(request.headers.cookie ?? "")?.[1];
    back.searchParams.set("code", chosen ?? "editor");
    back.searchParams.set("state", url.searchParams.get("state"));
    return send(response, 302, undefined, { location: back.href });
  }
  if (path === "/login/oauth/access_token" && request.method === "POST") {
    const { code, client_secret: secret } = await read(request);
    if (secret !== "browser-test-github-secret-only") return send(response, 401, {});
    return send(response, 200, { access_token: `token-${code}` });
  }
  // Test controls: change a file as if an agent had committed, list commits.
  if (path === "/__touch" && request.method === "POST") {
    const { token: owner, file, raw } = await read(request);
    const state = repoFor(owner);
    state.files.set(`${root}/${file}`, raw);
    state.commits.push({ sha: commitSha(), path: `${root}/${file}`, raw, login: "agent", date: new Date().toISOString(), message: "Agent edit" });
    return send(response, 200, { ok: true });
  }
  if (path === "/__commits") {
    const state = repoFor(url.searchParams.get("token"));
    return send(response, 200, state.commits.filter((commit) => commit.login !== "tengl"));
  }
  if (!token.startsWith("token-")) return send(response, 401, { message: "Bad credentials" });
  const who = person(token);
  const state = repoFor(token);
  if (path === "/user") return send(response, 200, { login: who.login, name: who.name || null });
  if (path === `/repos/${repo}`)
    return send(response, 200, { full_name: repo, permissions: { pull: true, push: who.push } });
  if (path === `/repos/${repo}/commits`) {
    const file = url.searchParams.get("path");
    const list = state.commits.filter((commit) => commit.path === file).reverse();
    return send(
      response,
      200,
      list.map((commit) => ({
        sha: commit.sha,
        author: { login: commit.login },
        commit: { message: commit.message, author: { name: commit.login, date: commit.date } },
      })),
    );
  }
  const prefix = `/repos/${repo}/contents/`;
  if (path.startsWith(prefix)) {
    const file = decodeURIComponent(path.slice(prefix.length));
    if (request.method === "GET") {
      const ref = url.searchParams.get("ref") ?? "main";
      const raw =
        ref === "main"
          ? state.files.get(file)
          : state.commits.find((commit) => commit.sha === ref && commit.path === file)?.raw;
      if (raw === undefined) return send(response, 404, { message: "Not Found" });
      return send(response, 200, {
        sha: blob(raw),
        encoding: "base64",
        content: Buffer.from(raw).toString("base64"),
      });
    }
    if (request.method === "PUT") {
      if (!who.push) return send(response, 403, { message: "Resource not accessible" });
      const body = await read(request);
      // Codes containing "protected" act as if branch protection refuses pushes.
      if (token.includes("protected"))
        return send(response, 409, { message: "Changes must be made through a pull request." });
      const current = state.files.get(file);
      if (current === undefined || body.sha !== blob(current))
        return send(response, 409, { message: `${file} does not match ${body.sha}` });
      const raw = Buffer.from(body.content, "base64").toString("utf8");
      const sha = commitSha();
      state.files.set(file, raw);
      state.commits.push({ sha, path: file, raw, login: who.login, date: new Date().toISOString(), message: body.message });
      return send(response, 200, {
        content: { sha: blob(raw) },
        commit: { sha, html_url: `http://127.0.0.1:${port}/${repo}/commit/${sha}` },
      });
    }
  }
  send(response, 404, { message: "Not Found" });
}).listen(port, "127.0.0.1");
