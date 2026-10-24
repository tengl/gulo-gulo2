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
Plus-knappen väljer produkten och skickar valet till chatten. Namnet och info-i:et
efter namnet visar produktinformation (UX-011). Variant-/lägg-till-knappar ägs av konversation
enligt CHATT-014.

`ui/ProductInfoButton.tsx` visar namn med info-i och öppnar samma produktdialog i båda menyerna
(UX-011). Använd `productFacts` och katalogens prisfunktioner; duplicera inte
produkttexter. Info-knappen är syskon till produktvalet, aldrig en nästlad knapp.
Dialogen använder Sheet/fokusåterställning och renderas i body så att chattmenyns
stilar inte spiller över. Den ska varken skicka meddelanden eller ändra utkastet.
SheetPresence behåller portalen inert under stängningsanimationen (UX-012).
