`ordering.spec.ts` och `chat.spec.ts` provar meny, chatt, lokal historik och
avbokning på mobil och dator, kopplat till UX-, CHATT- och ORD-ID:n.
Modellsvar mockas i transporttester; CI behöver inga Claude-nycklar.
Kör `npm run test:browser`; `playwright.config.ts` startar testserver på port 3100.
Installera Chromium med `npm exec -- playwright install chromium`, eller använd
`PLAYWRIGHT_CHANNEL=chrome` när Chrome redan finns. CI installerar Chromium.
De ska verifiera beslutade regel-ID:n från `rules/`, inklusive felvägar.
Enbart teständringar ska köra kontroller utan att skapa en deployment.
