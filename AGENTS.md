# Arbeta i Gulo Gulo 2

Gulo Gulos nya interna system och mobila beställningstjänst byggs här från
grunden med Next.js/Vercel, Supabase och Claude. Kund och personal arbetar med
samma beställning. Nu finns en provbar app med lokal demodata; den är ännu
inte ansluten till riktig orderlagring, betalning eller Google-publicering.
Separat publik test/demo konfigureras för Netlify enligt SYS-014.

Börja varje ny uppgift så här:

1. Läs [projektkontexten](docs/project-context.txt): mål, verifierat nuläge,
   kodkarta, senaste beslut och uppskjutet arbete. Utgå inte från chatthistorik.
2. Läs [regelregistret](rules/index.txt) och [systemreglerna](rules/system.txt).
   Läs sedan berörda regelområden och katalogernas `AGENTS.md` före ändring.
3. Kontrollera `git status` och berörd implementation innan du väljer lösning.
   Bevara användarens pågående ändringar och lokala miljökonfiguration.

Gällande regeltexter är facit. Projektkontexten beskriver implementation och
arbetsläge; den är ingen parallell regelkälla. Den gamla `docs/rules.txt` och
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
- När funktioner, integrationsstatus eller arbetsprioritering ändras: uppdatera
  projektkontexten och berörda lokala instruktioner i samma ändring. Förvara
  verksamhetsbesluten i rätt regelfil och hänvisa till deras ID:n från kontexten.
  Spara inte hemligheter, tillfälliga testkoder eller fullständiga chattloggar där.

Detta dokument är en ingång till reglerna; förvara inte nya verksamhetsregler här.
