# Beställningar och förfrågningar

Beställningsutkast, versionsbundet godkännande, order och betalningsstatus.

Regelunderlag: `rules/proposals/ordering.txt`. Läs status på varje post innan implementation.
Beslutat mottagningsfönster för samma dag och övergång till förbeställning finns
i `rules/runtime/business-hours.txt` (OPPEN-011 och OPPEN-013).

`domain/cart.ts` implementerar ett lokalt demoutkast enligt UX-003 och UX-006–009.
`ui/OrderSummary.tsx` visar och redigerar samma utkast. Ingen order sparas,
betalas eller reserveras. Koppla framtida server-use cases härifrån, inte från UI.
