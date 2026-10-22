# Konversation

Dialogtillstånd och validerade verktygsåtgärder. Claude-adaptern ligger i server/claude.

Regelunderlag: `rules/proposals/conversation.txt`. Läs status på varje post innan implementation.

`domain/demo-request.ts` känner igen en avgränsad grammatik enligt UX-008 och
ger granskningsbara förslag. Den är inte en AI-chatt. `ui/OrderingExperience.tsx`
sätter samman meny, textförslag och samma demoutkast. Claude och röst återstår.
