`ordering.spec.ts` och `chat.spec.ts` provar meny, chatt, lokal historik och
avbokning på mobil och dator, kopplat till UX-, CHATT- och ORD-ID:n.
Modellsvar mockas i transporttester; CI behöver inga Claude-nycklar.
Kör `npm run test:browser`; `playwright.config.ts` startar testserver på port 3100.
Installera Chromium med `npm exec -- playwright install chromium`, eller använd
`PLAYWRIGHT_CHANNEL=chrome` när Chrome redan finns. CI installerar Chromium.
De ska verifiera beslutade regel-ID:n från `rules/`, inklusive felvägar.
`admin.spec.ts` provar serverns kodskydd, session, standardvecka och datumundantag.
Testservern använder en separat syntetisk admin-kod från playwright.config.ts;
återanvänd aldrig en riktig kod.
`admin-orders.spec.ts` provar delad demohistorik, statusövergångar, inaktuella förslag,
lagringsfel och orderljud. Ljudtestet instrumenterar riktiga Web Audio-noder och
verifierar startade signaler; det verifierar inte operativsystemets högtalare.
Säkerhetstester för signering finns i
`tests/security/` och körs via `npm test` med Node-villkoret `react-server`.
Enbart teständringar ska köra kontroller utan att skapa en deployment.
