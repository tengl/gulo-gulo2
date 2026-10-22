# Databasen

Läs SYS-006–009 och relevanta regler innan schema eller SQL ändras.

Nuläge: endast config.toml och seed.sql utan verksamhetsdata. Inga migrationer,
verksamhetstabeller, RLS eller SQL-tester är implementerade. Webbappen använder
lokal demodata.

- `migrations/`: enda versionshistoriken för driftens schema, RLS och funktioner.
- `tests/`: SQL/pgTAP för behörighet, integritet och samtidighetskrav.
- `seed.sql`: endast syntetiska utvecklingsdata; laddas inte av releaseflödet.
- `config.toml`: lokal konfiguration, inte en automatisk ändring av driftprojektet.

Skapa migration med `npm exec -- supabase migration new <namn>`.
Verifiera med lokal start, `npm run db:reset`, `npm exec -- supabase db lint
--level error` och `npm run db:test` när SQL-tester finns. Släppta migrationer
ändras genom en ny migration. Godkända produktfakta finns i rules/runtime/catalog.txt;
övriga gamla verksamhetsvärden behåller sin uttryckliga status i regelregistret.

Produktionsmigration körs före webbdeploymenten och måste stödja föregående
appversion. Beskriv återhämtning för riskfyllda ändringar. Webrollback återställer
inte databasen. Genererade TS-typer placeras senare i server/supabase/.
