# Webbplatsen

Den publika webbplatsen enligt `rules/runtime/site.txt` (WEBB-001–019).
Routes ligger i `src/app/(site)/`, texterna i `apps/web/content/` (läs
`content/AGENTS.md`) och laddas av `src/server/content/load.ts` vid bygget.

- `domain/content.ts`: schema och svenska felmeddelanden för innehållsfilerna.
- `domain/markdown.ts`: Markdown till HTML, ankare med `{#id}` och länkkontroll
  (sidor, ankare med förslag vid felstavning, https för externa länkar).
- `domain/site.ts`: sidornas adresser, menyuppställning, schema.org-data och
  `/llms.txt`. Allt byggs från samma källor som sidorna (WEBB-010); skriv inte
  egna kopior av priser eller tider.
- `domain/content-edit.ts`: fälten som admin visar och ändringar som skrivs in
  på plats, utan att resten av filen formateras om (WEBB-015).
- `ui/`: sidhuvud, sidfot, nyhetsbrevsformulär, innehållssida och admins
  textredigering `TextsAdmin` med `LinkInserter`, som väljer länkmål ur
  `linkTargets` i `domain/site.ts` (route `app/admin/texter`, server i
  `server/github/` och `server/content/editable.ts`).

`ORDERING_IS_DEMO` säger på webbplatsen och i `/llms.txt` att beställningen är
en demo. Ändra den först när riktiga beställningar tas emot.
Indexering styrs av `SITE_INDEXABLE` (WEBB-014); demo och preview indexeras inte.
Stilarna ligger i `src/app/styles/14-site.css`.
