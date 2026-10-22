import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([".next/**", ".next-e2e/**", "next-env.d.ts"]),
  {
    files: ["src/modules/**/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["next", "next/**", "react", "react/**", "@supabase/**", "@anthropic-ai/**", "@/server/**", "@/app/**", "node:*"],
          message: "Domänlogik ska vara fristående. Se rules/system.txt SYS-004 och modulinstruktionerna.",
        }],
      }],
    },
  },
]);
