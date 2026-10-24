# Webbplatsens texter

Regler: WEBB-006–008 i `rules/runtime/site.txt`. Människor redigerar också här,
ofta direkt på GitHub; `README.md` är deras instruktion och ska hållas korrekt.

- Läs filen i aktuellt skick före varje ändring och gör minsta möjliga ändring.
  Skriv aldrig om en fil från minnet eller från den gamla Squarespace-siten.
- Schemat för fälten finns i `src/modules/site/domain/content.ts`. Lägger du till
  ett fält: uppdatera schemat, README.md och testet i `site/content.test.ts`.
- Priser, meny och öppettider skrivs inte här (WEBB-007); de kommer från catalog
  och business-hours. Produktfakta här är webbplatstext, inte godkända KAT-fakta
  för chatten.
- Admin (`/admin/texter`) sparar hit som commits i personalens namn
  (WEBB-015–018). Behandla dem som en människas ändring. Admin visar alla
  textfält utom `bild` och `gammalAdress`; nya fält blir redigerbara där
  automatiskt men behöver en svensk etikett i `site/domain/content-edit.ts`.
- `gammalAdress` styr omdirigeringen från Squarespace i `next.config.ts`.
- Kör `npm run check`; innehållskontrollen anger fil och fält på svenska.
