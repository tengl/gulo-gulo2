# Kundappens skal

Sätter samman kundens beställningsvy av andra modulers publika UI. Här ligger
ingen verksamhetslogik: varukorg, order och dialog ägs av `ordering/`,
`catalog/` och `conversation/`.

Regler: UX-reglerna i `rules/runtime/ordering-experience.txt`, OPPEN-016–017 och
CHATT-016 i `conversation.txt`.

`ui/OrderingExperience.tsx` sätter samman chatten, menyn, varukorgen och historiken
till kundens beställningsvy; varje del kommer från sin moduls `ui.ts`.
`ui/useOrderingView.ts` sköter vybyten (UX-013): riktningen kommer från vyordningen
och sätts som `data-nav-direction` på `<html>`; CSS:en i `app/styles/06-dialogs-and-motion.css` låter bara
`.experience-main` glida och ger navigering, tidsbanner, varukorg och dock egna
`view-transition-name`. Utan View Transitions glider bara den inkommande vyn via
Web Animations, utan `inert`. Varje vy får tillbaka sin scrollposition. Chat
monteras inte om, senast begärda vy vinner även för riktiga klick under
övergången och minskad rörelse byter direkt. Ett namn får bara finnas på ett
synligt element åt gången, annars hoppar webbläsaren över övergången. Dialogernas SheetPresence behåller
bara en inaktiv presentation efter godkänd stängning (UX-012).
`ui/StoreHeader.tsx` visas inne i chattens scrollområde tillsammans med
introduktionen (OPPEN-016); tidsbannern ligger kvar ovanför samtalet. Varukorgen
är fortsatt nåbar från navigationen. Dölj inte tiderna när första meddelandet skickas.
`ui/ConfigureProduct.tsx` är dialogen för variant, antal och bortval. Den visar
domänens felmeddelande och lägger inte till något när valet avvisas.
