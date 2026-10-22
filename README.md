# Gulo Gulo 2

Gulo Gulos nya interna system och beställningstjänst. Next.js på Vercel,
Supabase och Claude. Kunden ska kunna beställa i en chatt med text/röst.
Pris, kapacitet, lager och ordrar avgörs av vanlig programkod och databas.
Administrationen ska även kunna uppdatera öppettider i Google och skydda
vissa funktioner med superadmin-kod eller inloggning.

Startsidan kombinerar en mobil chatt, meny och gemensam varukorg. Fråga om
produkter och tillverkning, välj via båda vyerna och granska alla val tillsammans.
Öppettider syns i det kompakta sidhuvudet. Beställningstider visas i chatt och meny;
på mobil krymper huvudet ytterligare när samtalet börjar. Snabbval finns kvar
under samtalet, chattmenyn är klickbar och skrivfältet växer med texten.
Spara lokala demobeställningar som finns kvar efter omladdning och prova avbokning
via chatt eller GUI. Ingen riktig order skickas, betalning görs eller tid reserveras.

- Börja i [regelregistret](rules/index.txt): beslutade textregler är facit.
  Regler som beslutats finns i `rules/runtime/`; återstående äldre förslag har egen status.
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

Meny och begränsat chattdemoläge fungerar utan API-nycklar. För fri Claude-dialog:
kopiera `apps/web/.env.example` till `apps/web/.env.local`, fyll i
`ANTHROPIC_API_KEY` och `ANTHROPIC_MODEL` och starta om utvecklingsservern.
Välj ett modell-ID som ditt Anthropic-konto har tillgång till. Nyckeln stannar på servern.

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
testserver på port 3100. Ingen extern tjänst behövs för testerna. Röst, hämtningstider,
riktig orderlagring i Supabase, betalning och säker orderåtkomst återstår att ansluta.

GitHub Actions skiljer kontroller från deployment. App-/driftregeländringar
kan släppa webben; SQL-migrationer kan släppa databasen. Dokumentation,
agentinstruktioner, enbart tester och evals skapar inga deployments.
Miljöer och nycklar behöver kopplas enligt driftinstruktionen innan en release
kan köras. Inga externa projekt har skapats eller deployats av grundarbetet.
