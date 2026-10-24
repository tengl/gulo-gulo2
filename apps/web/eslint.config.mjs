import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// SYS-004: other modules are used through their index.ts (domain) or ui.ts (UI);
// a module's own files import each other relatively.
const publicApi = {
  group: ["@/modules/*/ui/**", "@/modules/*/domain/**", "@/modules/*/application/**"],
  message: "Importera andra moduler via deras publika index.ts eller ui.ts. Se SYS-004 och src/modules/AGENTS.md.",
};

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([".next/**", ".next-e2e/**", "next-env.d.ts"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [publicApi] }],
    },
  },
  {
    files: ["src/modules/**/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [publicApi, {
          group: ["next", "next/**", "react", "react/**", "@supabase/**", "@anthropic-ai/**", "@/server/**", "@/app/**", "node:*"],
          message: "Domänlogik ska vara fristående. Se rules/system.txt SYS-004 och modulinstruktionerna.",
        }],
      }],
    },
  },
]);
