import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : path.endsWith(".txt") ? [path] : [];
  });
}

const root = fileURLToPath(new URL("../rules/", import.meta.url));
const ids = new Map();
const replacements = [];
for (const file of filesIn(root)) {
  const lines = readFileSync(file, "utf8").split("\n");
  for (const [index, line] of lines.entries()) {
    if (!/^\[[A-Z]+-/.test(line)) continue;
    const name = relative(root, file);
    const location = `${name}:${index + 1}`;
    const match = /^\[([A-Z]+-\d{3,})\] \[([^\]]+)\] (\S.*)$/.exec(line);
    if (!match) throw new Error(`Invalid rule format at ${location}`);
    const [, id, status] = match;
    if (name.startsWith("runtime/") && status !== "GÄLLANDE") {
      throw new Error(`Only decided rules belong in runtime/: ${location}`);
    }
    if (ids.has(id)) throw new Error(`Duplicate ${id} at ${location} and ${ids.get(id)}`);
    ids.set(id, location);
    if (!["GÄLLANDE", "FÖRSLAG", "ÖPPET", "HISTORIK"].includes(status)) {
      const replacement = /^ERSATT AV ([A-Z]+-\d{3,})$/.exec(status);
      if (!replacement) throw new Error(`Unknown status for ${id}: ${status}`);
      replacements.push([id, replacement[1]]);
    }
  }
}
for (const [id, target] of replacements) {
  if (!ids.has(target) || id === target) throw new Error(`Invalid replacement: ${id} -> ${target}`);
}
// Code, tests and evals may only cite rule IDs that exist. "CHATT-001/002" and
// "OPPEN-005–009" cite both numbers with the same prefix.
const prefixes = new Set([...ids.keys()].map(id => id.split("-")[0]));
const repository = fileURLToPath(new URL("../", import.meta.url));
function sourcesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : sourcesIn(path);
    return /\.(tsx?|mjs|json)$/.test(entry.name) ? [path] : [];
  });
}
const missing = [];
let cited = 0;
for (const directory of ["apps/web/src", "tests", "evals"]) {
  for (const file of sourcesIn(join(repository, directory))) {
    for (const [index, line] of readFileSync(file, "utf8").split("\n").entries()) {
      for (const match of line.matchAll(/\b([A-Z]{2,6})-(\d{3})((?:[/–-]\d{3})*)/g)) {
        const [, prefix, first, rest] = match;
        if (!prefixes.has(prefix)) continue;
        for (const number of [first, ...(rest.match(/\d{3}/g) ?? [])]) {
          cited++;
          const id = `${prefix}-${number}`;
          if (!ids.has(id)) missing.push(`${id} at ${relative(repository, file)}:${index + 1}`);
        }
      }
    }
  }
}
if (missing.length) throw new Error(`Cited rule IDs that do not exist:\n${missing.join("\n")}`);
console.log(`Rules: ${ids.size} unique IDs; statuses, replacement targets and ${cited} citations verified.`);
