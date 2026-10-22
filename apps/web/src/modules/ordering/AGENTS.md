# Beställningar och förfrågningar

Beställningsutkast, versionsbundet godkännande, order och betalningsstatus.

Regelunderlag: `rules/proposals/ordering.txt`. Läs status på varje post innan implementation.
Beslutat mottagningsfönster för samma dag och övergång till förbeställning finns
i `rules/runtime/business-hours.txt` (OPPEN-011 och OPPEN-013).

`domain/cart.ts` äger utkastet. `domain/saved-orders.ts` äger lokala demoposter,
validering, prisögonblicksbild och avbokningskontrollen ORD-016.
`ui/useOrderMemory.ts` lagrar i localStorage, rapporterar fel och synkar flikar.
`ui/OrderSummary.tsx` och `SavedOrders.tsx` visar samma data. Inga riktiga
ordrar skapas, betalas eller reserveras. Lokalt minne är aldrig behörighetsbevis.
Se CHATT-005–009. Koppla framtida server-use cases härifrån, inte från UI.
