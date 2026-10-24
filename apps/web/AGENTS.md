# Webbapplikationen

Läs `rules/system.txt` SYS-003–007 och regelområdet som berörs av ändringen.

- `src/app/`: Next.js-routes, layout och sammansättning av use cases/adaptrar.
- `src/modules/<område>/`: områdets domän, use cases och funktionens UI.
- `src/server/`: Supabase, Claude och andra externa adaptrar.
- `src/shared/`: endast små gemensamma presentations-/teknikdelar.
- Placera tester intill koden som `<namn>.test.ts` eller i `__tests__/`.
- Använd `import "server-only"` i moduler som läser hemligheter eller använder
  privilegierade integrationer. Klientkomponenter får bara använda säkra DTO:er
  och uttryckligt klientgränssnitt. Validera all data vid servergränsen.

`/` och övriga sidor i `src/app/(site)/` är den publika webbplatsen; läs
`rules/runtime/site.txt`, `src/modules/site/AGENTS.md` och `content/AGENTS.md`.
`/bestall` kombinerar chatt, meny, gemensam varukorg och lokal demohistorik.
Läs `rules/runtime/ordering-experience.txt`, `conversation.txt`, `catalog.txt` och
`ordering.txt`. Claude ansluts via `/api/chat` när nyckel och modell är satta.
`/admin` använder serververifierad superadmin-kod. Läs runtime/access.txt och
administration.txt. Tidsredigeringen är en lokal förhandsvisning. Riktiga ordrar,
databas, personliga konton, Google-publicering, betalning och röst återstår.
`/admin/bestallningar` visar lokal demohistorik med bekräftade statusändringar.
Alla adminsidor kontrollerar sessionen via `app/admin/AdminScreen.tsx`;
flytta inte åtkomstkontrollen till enbart layouten. Orderljudet ägs av staff.
Undantag: `/admin/texter` kräver GitHub-inloggning i stället (WEBB-018) och
kontrollerar den i sin page och i varje `/api/admin/content`-anrop.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
