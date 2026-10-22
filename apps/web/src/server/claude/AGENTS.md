# Claude-adaptern

Läs CHATT-003–009 och SYS-005–007. `chat.ts` läser hemligheter endast på servern,
bygger faktakontext från katalogens publika API och anropar Messages API.
Modell-ID måste anges tillsammans med nyckeln; bygg och begränsad demo kräver ingetdera.

Verktyg ger enbart granskningsbara förslag. Validering och tillämpning hör i
konversations-/ordermodulerna. Inga modellverktyg får skriva direkt till lagring.
Använd inte gamla prompten som aktiv regelkälla. Produktfakta har eget facit i
`rules/runtime/catalog.txt`. Lägg språkmodellspecifika scenarier i `evals/`;
vanliga tester körs utan nycklar och faktiska modellkostnader.
