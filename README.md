# Gulo Gulo 2

Gulo Gulos nya interna system och beställningstjänst. Next.js på Vercel,
Supabase och Claude. Kunden ska kunna beställa i en chatt med text/röst.
Pris, kapacitet, lager och ordrar avgörs av vanlig programkod och databas.
Administrationen ska även kunna uppdatera öppettider i Google och skydda
vissa funktioner med superadmin-kod eller inloggning.

Repot innehåller en byggbar grundstruktur. Affärsfunktioner och integrationer
är ännu inte implementerade.

- Börja i [regelregistret](rules/index.txt): beslutade textregler är facit.
  Äldre verksamhetsregler är grupperade förslag, inte bindande krav.
- [Arkitektur och kodkarta](docs/architecture.md).
- [Lokal utveckling och deployment](docs/deployment.md).
- [Instruktioner för agenter](AGENTS.md).

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

GitHub Actions skiljer kontroller från deployment. App-/driftregeländringar
kan släppa webben; SQL-migrationer kan släppa databasen. Dokumentation,
agentinstruktioner, enbart tester och evals skapar inga deployments.
Miljöer och nycklar behöver kopplas enligt driftinstruktionen innan en release
kan köras. Inga externa projekt har skapats eller deployats av grundarbetet.
