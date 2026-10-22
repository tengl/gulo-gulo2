# Gulo Gulo 2

Gulo Gulos nya interna system och beställningstjänst. Next.js på Vercel,
Supabase och Claude. Kunden ska kunna beställa i en chatt med text/röst.
Pris, kapacitet, lager och ordrar avgörs av vanlig programkod och databas.
Administrationen ska även kunna uppdatera öppettider i Google och skydda
vissa funktioner med superadmin-kod eller inloggning.

Startsidan innehåller en mobil demoversion: välj från menyn eller skriv en enkel
beställning, justera antal/variant/bortval och granska samma beställningsutkast.
Menyn och priserna är godkända demodata från det äldre repot. Ingen riktig order
skickas, ingen betalning görs och ingen kapacitet reserveras.

- Börja i [regelregistret](rules/index.txt): beslutade textregler är facit.
  Äldre verksamhetsregler är grupperade förslag, inte bindande krav.
- [Arkitektur och kodkarta](docs/architecture.md).
- [Lokal utveckling och deployment](docs/deployment.md).
- [Instruktioner för agenter](AGENTS.md).

Koden skrivs av AI-agenter. Lokala arbetsinstruktioner finns i `AGENTS.md` nära
koden och delas av Codex och uppdaterad Claude Code. Regeltexterna finns i
`rules/`; denna README är en kort ingång, inte en separat instruktionskälla.

Med Node 24 installerat:

```sh
npm ci
npm run dev
```

Grundsidan fungerar utan API-nycklar. När integrationer införs används
`apps/web/.env.example` som hemlighetsfri mall.

```sh
npm run check
npm run build
```

Webbläsartester för mobil och dator:

```sh
npm exec -- playwright install chromium
npm run test:browser
```

Om Google Chrome redan är installerat kan du i stället köra
`PLAYWRIGHT_CHANNEL=chrome npm run test:browser`. Testerna startar en egen
testserver på port 3100. Ingen extern tjänst behövs. Fri Claude-dialog,
röst, hämtningstider, inskick och betalning återstår att bygga.

GitHub Actions skiljer kontroller från deployment. App-/driftregeländringar
kan släppa webben; SQL-migrationer kan släppa databasen. Dokumentation,
agentinstruktioner, enbart tester och evals skapar inga deployments.
Miljöer och nycklar behöver kopplas enligt driftinstruktionen innan en release
kan köras. Inga externa projekt har skapats eller deployats av grundarbetet.
