# Produktfakta och prisunderlag

Produkter, varianter, ingredienser och deterministisk prisberäkning.

Godkända fakta: `rules/runtime/catalog.txt`. Återstående förslag finns i
`rules/proposals/catalog.txt`; läs status före implementation.

`domain/demo-menu.ts` innehåller den godkända demokatalogen enligt UX-004–007
i `rules/runtime/ordering-experience.txt`. Publikt domän-API finns i `index.ts`,
menykomponenten i `ui/`. Ändra inte demostatus till driftgodkännande implicit.

`domain/knowledge.ts` ger samma produkt-/tillverkningsfakta till Claude och nyckelfri
fallback. Priser beräknas från demokatalogen, aldrig från modelltext.

`ui/ChatMenu.tsx` visar samma katalog som klickbara val inne i samtalet
(CHATT-012). Klick lämnar ett produktval till chattens vanliga granskningsflöde.
