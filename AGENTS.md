# Arbeta i Gulo Gulo 2

Läs [rules/index.txt](rules/index.txt), relevanta regelområden och instruktionerna
i berörd katalog. Gällande regeltexter är facit. Den gamla `docs/rules.txt` och
poster märkta FÖRSLAG är underlag, inte beslutade verksamhetsregler.

Repots kod skrivs av AI-agenter. Läs före ändring varje `AGENTS.md` längs vägen
från reporoten till den berörda filens katalog, även när sessionen startar i roten.
Alla underkatalogers instruktioner laddas inte automatiskt vid sessionsstart.
Codex och uppdaterad Claude Code använder samma `AGENTS.md`-filer. Förvara
arbetsinstruktioner här eller i rätt underkatalog, utan separata verktygskopior.
Se SYS-013.

- Karta och beroenderiktning: [docs/architecture.md](docs/architecture.md).
- Lokal körning och release: [docs/deployment.md](docs/deployment.md).
- Ett verksamhetsbeslut skrivs först i rätt textfil med stabilt regel-ID och
  beslutskälla. Anpassa sedan kod och relevanta tester i samma ändring.
- Koda i ägande modul. Importera andra moduler via deras publika API.
- När körningsfiler tillkommer, kontrollera `tooling/changes.mjs` och dess tester.
- Kör `npm run check` och `npm run build` vid kod-/verktygsändringar. Vid enbart
  dokumentation: granska hänvisningar och status utan att kräva appbygge.
- Lämna kort återrapportering med ändring, verifiering och kvarstående beslut.

Detta dokument är en ingång till reglerna; förvara inte nya verksamhetsregler här.
