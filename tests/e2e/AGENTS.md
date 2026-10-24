`ordering.spec.ts` och `chat.spec.ts` provar meny, chatt, lokal historik och
avbokning på mobil och dator, kopplat till UX-, CHATT- och ORD-ID:n.
Modellsvar mockas i transporttester; CI behöver inga Claude-nycklar.
Kör `npm run test:browser`; `playwright.config.ts` startar testserver på port 3100.
Installera Chromium med `npm exec -- playwright install chromium`, eller använd
`PLAYWRIGHT_CHANNEL=chrome` när Chrome redan finns. CI installerar Chromium.
De ska verifiera beslutade regel-ID:n från `rules/`, inklusive felvägar.
`motion.spec.ts` provar UX-012–013: glidriktning, native/fallback, riktiga klick
under övergången, scrollposition per vy, minskad rörelse och dialogstängning med fokus- och scrollåterställning.
`admin.spec.ts` provar serverns kodskydd, session, standardvecka och datumundantag.
Testservern använder en separat syntetisk admin-kod från playwright.config.ts;
återanvänd aldrig en riktig kod.
`admin-orders.spec.ts` provar delad demohistorik, statusövergångar, inaktuella förslag,
lagringsfel och orderljud. Ljudtestet instrumenterar riktiga Web Audio-noder och
verifierar startade signaler; det verifierar inte operativsystemets högtalare.
Säkerhetstester för signering finns i
`tests/security/` och körs via `npm test` med Node-villkoret `react-server`.
Enbart teständringar ska köra kontroller utan att skapa en deployment.
`site.spec.ts` provar webbplatsen (WEBB-001–014): sidor, meny som text, 301 från
gamla adresser, schema.org/llms-filer, noindex i testmiljön, djuplänk och nyhetsbrev.
Beställningen ligger på `/bestall`; `/` är webbplatsen.
`texts.spec.ts` provar textredigeringen (WEBB-015–018) mot `tests/fakes/github.mjs`,
som Playwright startar på port 3101. Varje test väljer egen inloggningskod med
kakan `fake-github-code` och får då en egen kopia av repot i attrappen.
