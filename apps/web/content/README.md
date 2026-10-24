# Webbplatsens texter

Här ligger texterna på gulogulo.se. Enklast ändrar du dem i administrationen på
`/admin/texter`: logga in med ditt GitHub-konto, välj text, ändra och spara. Du
kan också ändra dem direkt här på GitHub, eller be en agent göra det.

## Ändra en text på GitHub

1. Öppna filen, till exempel `sidor/event.md` eller `produkter/brewurst.md`.
2. Klicka på pennan (Edit this file) uppe till höger.
3. Ändra texten. Rader mellan de två `---` överst är fält: ändra bara det som
   står efter kolon och behåll indraget.
4. Klicka på **Commit changes…**, välj **Create a new branch** och sedan
   **Propose changes** och **Create pull request**.
5. Kontrollerna körs automatiskt. Blir något rött står det vilken fil och vilket
   fält som behöver rättas. När allt är grönt kan ändringen slås ihop.

## Var finns vad?

| Fil | Sida |
|---|---|
| `webbplats.md` | Adress, telefon, länkar till karta, Instagram, Facebook och webbshop |
| `sidor/start.md` | Startsidan |
| `sidor/event.md` | Event och catering |
| `sidor/om.md` | Om oss: Niklas och järven |
| `sidor/swish.md` | Handla när vi har stängt |
| `sidor/integritet.md` | Integritet och nyhetsbrevet |
| `produkter/*.md` | En fil per produkt från charkuteriet |

Bilder ligger i `../public/bilder/` och anges som `/bilder/namn.jpg`.

## Skriva

- `## Rubrik` ger en mellanrubrik, `**fet**` ger fetstil och en rad som börjar
  med `- ` blir en punktlista.
- En länk skrivs `[text](/meny)`. Interna länkar måste leda till en sida som finns.
- En ny produkt: kopiera en befintlig fil i `produkter/`, byt filnamn (små
  bokstäver, siffror och bindestreck) och ge den ett eget `ordning`-nummer.

## Det som inte ändras här

Priser och grillmenyn kommer från menyn i beställningen, och öppettider från
tidsmodulen. På så sätt visar webbplatsen, chatten och beställningen alltid
samma uppgifter. Be en agent om du vill ändra dem.
