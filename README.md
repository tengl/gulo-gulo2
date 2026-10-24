# Gulo Gulo 2

Gulo Gulos nya interna system och beställningstjänst. Next.js på Vercel,
Supabase och Claude. Kunden ska kunna beställa i en chatt med text/röst.
Pris, kapacitet, lager och ordrar avgörs av vanlig programkod och databas.
Administrationen ska även kunna uppdatera öppettider i Google och skydda
vissa funktioner med superadmin-kod eller inloggning.

`/` är den publika webbplatsen (tidigare Squarespace): meny med priser,
charkuteriets produkter, event, om oss och nyhetsbrev. **Texterna ändras i
[apps/web/content/](apps/web/content/README.md)**, även direkt på GitHub.

`/bestall` kombinerar en mobil chatt, meny och gemensam varukorg. Fråga om
produkter och tillverkning, välj via båda vyerna och granska alla val tillsammans.
Öppettider syns med loggan. I chatten scrollar sidhuvud och introduktion upp,
medan tidsbannern stannar synlig; menyn har samma sticky beställningstider. Snabbval finns kvar
under samtalet, chattmenyn är klickbar och skrivfältet växer med texten.
Spara lokala demobeställningar som finns kvar efter omladdning och prova avbokning
via chatt eller GUI. Ingen riktig order skickas, betalning görs eller tid reserveras.

`/admin` har kodinloggning, veckovy, standardvecka och datumundantag. Sätt en
separat slumpmässig `ADMIN_ACCESS_CODE` (minst 16 tecken) i `apps/web/.env.local`
och starta om servern. Utan kod är administrationen låst. Tider sparas tills
vidare endast som lokal förhandsvisning; kundvyn och Google påverkas inte.

`/admin/bestallningar` visar samma lokala demobeställningar som kunden ser.
Sök, filtrera och granska. Bekräfta mottagning, påbörja tillagning och markera
som tillagad; samma status uppdateras i kundens beställning. Betald, hämtad
och avbokad hanteras separat från mottagning och tillagning.
Aktivera orderljud för en signal när en ny demobeställning sparas, även från
en annan flik. Inga riktiga betalningar eller utlämningar registreras.

- Börja i [regelregistret](rules/index.txt): beslutade textregler är facit.
  Regler som beslutats finns i `rules/runtime/`; återstående äldre förslag har egen status.
- [Arkitektur och kodkarta](docs/architecture.md).
- [Lokal utveckling och deployment](docs/deployment.md).
- [Instruktioner för agenter](AGENTS.md).
- [Aktuellt projektläge och överlämning](docs/project-context.txt): läses av nya
  agenter tillsammans med instruktionerna. Swish-arbetet är tills vidare uppskjutet.

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
Miljöer och nycklar konfigureras enligt driftinstruktionen. Repot beskriver
releaseflödet; faktisk deploymentstatus kontrolleras i GitHub Actions/Vercel.

För publik test/demo finns separat [Netlify-konfiguration](netlify.toml).
Bygginställningar och filter ligger i repot; enbart dokumentation, tester eller
agentinstruktioner skapar inga nya automatiska demodeployments efter första bygget.
Se [Netlify-instruktionen](docs/deployment.md#publik-test-demowebb-på-netlify).
