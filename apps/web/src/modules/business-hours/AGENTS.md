# Öppettider och publicering

Redigerbara öppettider/hämtningstider och fönster för att ta emot beställningar
samma dag: standardvecka, datumundantag
och innevarande vecka med tydliga avvikelsemarkeringar. Use case för publicering
av öppettider till Google använder en port i server/google-business.
Synkriktning mot Google och detaljer om tidsgränser är ännu öppna.

Regelunderlag: `rules/runtime/business-hours.txt`. Läs status på varje post innan implementation.

`domain/demo-hours.ts` äger ordinarie demotider enligt OPPEN-016–017.
`ui/HoursOverview.tsx` visar endast öppettider i det kompakta sidhuvudet.
`ui/OrderingHours.tsx` visar beställningsfönstret inne i chatt och meny enligt
OPPEN-016; det får döljas när kunden börjat chatta på mobil. Samma fakta ges till
Claude. Detta är inte kapacitetskontroll eller redigerbar driftkonfiguration.
Administration, datumundantag och Google-publicering är ännu inte implementerade.
Följ `../AGENTS.md` när de införs; UI får inte skapa egna tider.
