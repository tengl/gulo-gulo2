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
console.log(`Rules: ${ids.size} unique IDs; statuses and replacement targets verified.`);
