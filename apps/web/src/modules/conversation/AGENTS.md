# Konversation

Dialogtillstånd och validerade verktygsåtgärder. Claude-adaptern ligger i server/claude.

Regler: `rules/runtime/conversation.txt`, `catalog.txt`, `ordering.txt` och UX-reglerna.
Övriga gamla dialogkrav finns kvar som förslag i `rules/proposals/conversation.txt`.

`domain/chat.ts` validerar kontext och modellverktyg och ger begränsad nyckelfri
fallback. `ui/Chat.tsx` håller meddelanden över vybyten. Förslag är bundna till
varukorgsversionen; inga modellverktyg får göra direkta mutationer.
`ui/OrderingExperience.tsx` sätter samman samma varukorg, historik och vyer.
Fri dialog går via server/claude; bygg inte en egen växande språkparser.
Lokala demostatusar från admin kan vara betald/hämtad enligt ADM-006. De accepteras
endast i den begränsade DEMO-kontexten, blockerar avbokningsförslag och ger inga
modellverktyg rätt att ändra betalningsstatus. Riktig serverstatus måste hämtas separat.

Snabbval finns kvar under hela samtalet (CHATT-010–011). `ChatComposer.tsx`
håller fokus och höjd för skrivfältet (CHATT-013). `show_menu` ger en strukturerad
meny som renderas av katalogens `ChatMenu`; tolka inte modelltext som prislista.
