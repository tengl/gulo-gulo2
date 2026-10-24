# Beställningar och förfrågningar

Beställningsutkast, versionsbundet godkännande, order och betalningsstatus.

Gällande underlag: `rules/runtime/ordering.txt`, `rules/runtime/conversation.txt`,
`rules/runtime/ordering-experience.txt` och `rules/runtime/administration.txt`
(ADM-005–009).
Återstående förslag: `rules/proposals/ordering.txt`. Läs status före implementation.
Beslutat mottagningsfönster för samma dag och övergång till förbeställning finns
i `rules/runtime/business-hours.txt` (OPPEN-011 och OPPEN-013).

`domain/cart.ts` äger utkastet. `domain/saved-orders.ts` äger lokala demoposter,
validering, prisögonblicksbild och avbokningskontrollen ORD-016.
Den äger även de uttryckligt simulerade adminstatusarna i ADM-005–006 och
versionsbunden ändring av dem. `saved` är obetald; `paid`/`collected` är lokala
markeringar och aldrig betalningsbevis för servern. Kundens GUI och chatten måste
återkontrollera samma avbokningsregel även när ett äldre förslag redan visas.
`preparation` följer new → confirmed → preparing → prepared enligt ADM-009,
oberoende av betalning. Saknat fält i äldre lokalt minne läses som new; anta
inte att en betalningsmarkering innebär bekräftad eller tillagad beställning.
`ui/useOrderMemory.ts` lagrar i localStorage, rapporterar fel och synkar flikar.
`ui/OrderSummary.tsx` och `SavedOrders.tsx` visar samma data. Inga riktiga
ordrar skapas, betalas eller reserveras. Lokalt minne är aldrig behörighetsbevis.
Se CHATT-005–009. Koppla framtida server-use cases härifrån, inte från UI.
`hasActiveCustomerOrders` styr kundens uppföljningssnabbval enligt CHATT-011:
obetald eller betald, inte hämtad/avbokad. Det är inte adminvyns summering i ADM-007.
