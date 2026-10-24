import { pathToFileURL } from "node:url";
import { changedFiles, classifyFiles } from "./changes.mjs";

// SYS-008/012: use the same deployment boundary as Actions, without dependencies.
// Netlify's ignore phase runs before installation and may use Node 18.
export function netlifyScope(env, git) {
  const head = env.COMMIT_REF;
  if (!head) throw new Error("Missing COMMIT_REF; refusing to guess deployment scope.");
  // A cleared cache sets both refs to HEAD. Treat this as an explicit full build.
  const base = env.CACHED_COMMIT_REF === head ? undefined : env.CACHED_COMMIT_REF;
  return classifyFiles(changedFiles({ base, head, mergeBase: false }, git));
}

function main() {
  const mode = process.argv[2];
  try {
    if (mode !== "ignore" && mode !== "verify") {
      throw new Error("Usage: node tooling/netlify.mjs ignore|verify");
    }
    const scope = netlifyScope(process.env);
    console.log(scope.web
      ? "Netlify: web changes or full build; run checks and build."
      : "Netlify: no web changes; automatic deployment can be skipped.");
    process.exitCode = mode === "ignore" && scope.web ? 1 : 0;
  } catch (error) {
    console.error(`Netlify scope error: ${error.message}`);
    // Ignore only supports skip (0) or continue (nonzero), not abort. Verify
    // repeats the check in the build command so invalid history stops publishing.
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
