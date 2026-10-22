`ordering.spec.ts` provar första demoflödet på mobil och dator, kopplat till UX-ID:n.
Kör `npm run test:browser`; `playwright.config.ts` startar testserver på port 3100.
Installera Chromium med `npm exec -- playwright install chromium`, eller använd
`PLAYWRIGHT_CHANNEL=chrome` när Chrome redan finns. CI installerar Chromium.
De ska verifiera beslutade regel-ID:n från `rules/`, inklusive felvägar.
Enbart teständringar ska köra kontroller utan att skapa en deployment.
