# Konversation

Dialogtillstånd och validerade verktygsåtgärder. Claude-adaptern ligger i server/claude.

Regler: `rules/runtime/conversation.txt`, `catalog.txt`, `ordering.txt` och UX-reglerna.
Övriga gamla dialogkrav finns kvar som förslag i `rules/proposals/conversation.txt`.

`domain/chat.ts` validerar kontext och modellverktyg och ger begränsad nyckelfri
fallback. `ui/Chat.tsx` håller meddelanden över vybyten. Förslag är bundna till
varukorgsversionen; inga modellverktyg får göra direkta mutationer.
Chat får aktiv vy uttryckligen och scrollar till slutet före visning vid återgång
(CHATT-016). Nytillkommen meny scrollas däremot till sina första produktval.
Huvudets toning följer scrollningen utan att ta bort dess plats i dokumentet.
`ui/OrderingExperience.tsx` sätter samman samma varukorg, historik och vyer.
`ui/StoreHeader.tsx` visas inne i chattens scrollområde tillsammans med
introduktionen (OPPEN-016); tidsbannern ligger kvar ovanför samtalet. Varukorgen
är fortsatt nåbar från navigationen. Dölj inte tiderna när första meddelandet skickas.
Fri dialog går via server/claude; bygg inte en egen växande språkparser.
Lokala demostatusar från admin kan vara betald/hämtad enligt ADM-006. De accepteras
endast i den begränsade DEMO-kontexten, blockerar avbokningsförslag och ger inga
modellverktyg rätt att ändra betalningsstatus. Riktig serverstatus måste hämtas separat.

Snabbval finns kvar under hela samtalet (CHATT-010–011). `ChatComposer.tsx`
håller fokus och höjd för skrivfältet (CHATT-013). `show_menu` ger en strukturerad
meny som renderas av katalogens `ChatMenu`; tolka inte modelltext som prislista.
`ChatShortcuts.tsx` behåller utgående knappar monterade för animation, men gör
dem genast inaktiva och inert (CHATT-016). Respektera minskad rörelse.
`show_cart` ger samma validerade text och `cart`-åtgärd i Claude- och demoläget.
CHATT-015 renderar Ändra och Granska som platta direktknappar under svaret;
de navigerar lokalt utan ytterligare modellanrop. Granska finns inte som snabbval.
Mina beställningar är snabbval endast för aktiva kundordrar (CHATT-011);
historiken är fortsatt tillgänglig via huvudnavigationen.

`ChatProposal.tsx` följer CHATT-014: två variantknappar, direkt godkännande för
en ensam produktrad utan variant, gemensamt godkännande för flera rader/ersättning.
Mörka knappar ändrar varukorgen; ljusa snabbval med rund kant skickar meddelanden.
Lägg inte till chattbubblor; menyn har separata plus för produktval och namn/info-i
för information enligt UX-011.
Behåll versionskontrollen och skyddet mot dubbla godkännanden även i snabbflödet.
