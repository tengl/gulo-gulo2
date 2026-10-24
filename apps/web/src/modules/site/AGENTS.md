# Webbplatsen

Den publika webbplatsen enligt `rules/runtime/site.txt` (WEBB-001–014).
Routes ligger i `src/app/(site)/`, texterna i `apps/web/content/` (läs
`content/AGENTS.md`) och laddas av `src/server/content/load.ts` vid bygget.

- `domain/content.ts`: schema och svenska felmeddelanden för innehållsfilerna.
- `domain/markdown.ts`: Markdown till HTML, ankare med `{#id}` och länkkontroll.
- `domain/site.ts`: sidornas adresser, menyuppställning, schema.org-data och
  `/llms.txt`. Allt byggs från samma källor som sidorna (WEBB-010); skriv inte
  egna kopior av priser eller tider.
- `ui/`: sidhuvud, sidfot, nyhetsbrevsformulär och innehållssida.

`ORDERING_IS_DEMO` säger på webbplatsen och i `/llms.txt` att beställningen är
en demo. Ändra den först när riktiga beställningar tas emot.
Indexering styrs av `SITE_INDEXABLE` (WEBB-014); demo och preview indexeras inte.
Stilarna ligger i `src/app/styles/14-site.css`.
