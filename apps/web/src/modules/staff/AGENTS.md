# Personalens arbetsflöden

Personalens orderhantering och presentation. Behörighet kontrolleras genom access.

Regelunderlag: `rules/runtime/administration.txt`, `rules/runtime/access.txt`
och `rules/proposals/staff.txt`. Läs status på varje post innan implementation.

`ui/AdminApp.tsx` är administrationens skal med navigering och anslutningsstatus.
Tidsredigeringen ägs av business-hours. `ui/OrdersAdmin.tsx` visar kundens
validerade lokala demohistorik; statusövergångar ägs av ordering och återkontrolleras
mot aktuellt minne efter sessionskontroll. `domain/order-board.ts` äger filter
och summeringar. `ui/OrderAdminDetails.tsx` äger granskning/bekräftelse för den valda referensen.
Mottagning/tillagning har egen status, separat från betalning och avbokning.
`domain/order-arrivals.ts` upptäcker nya referenser.
`ui/AdminOrderSound.tsx` och `ui/order-sound.ts` bevakar oberoende av vy/filter.
Ljudkontext och referensminne finns endast i klienten och överlever interna
adminvybyten, inte omladdning. Skapa ljudkontexten i användarens klick.
Riktiga ordrar, serverstatus och förfrågningar är inte anslutna. Lägg inte in
exempelordrar som kan uppfattas som verklig driftdata.
OrdersAdmin använder SheetPresence för godkänd stängning (UX-012).
Behåll busy-/sessions-/versionskontroller före uttoning; animationen muterar inget.
