# Utveckling och deployment

Regler: [SYS-006–012](../rules/system.txt). Arbetsflöde:
[pipeline.yml](../.github/workflows/pipeline.yml). Alla kommandon körs från
reporoten om inget annat anges.

## Lokalt

Använd Node 24 enligt `.node-version`, kör `npm ci` och `npm run dev`.
Appen finns på `http://localhost:3000`. Kör `npm run check` och `npm run build`
före kodändringar släpps. Inga externa nycklar behövs för grundsidan.
Startsidan har en chatt, meny, gemensamt utkast och lokalt sparade demobeställningar.
Utkast och historik finns i `localStorage` på enheten. Ingen riktig order skickas.
Fri Claude-dialog aktiveras när både `ANTHROPIC_API_KEY` och `ANTHROPIC_MODEL`
sätts i `apps/web/.env.local` (starta sedan om servern). Utan dessa visas begränsat
lägesstöd med enkla val och utvalda faktasvar. Nyckeln skickas aldrig till klienten.
Webbläsartester körs med `npm run test:browser` efter
`npm exec -- playwright install chromium`. De startar en separat lokal server
på port 3100 med egen `.next-e2e`-katalog och testkonfiguration, så att en
utvecklingsserver på port 3000 kan fortsätta köra. Testservern stänger uttryckligen
av Claude-nyckeln. CI verifierar samma flöden före release.

För serverintegrationer: kopiera `apps/web/.env.example` till
`apps/web/.env.local` om filen saknas och fyll i den lokala miljöns uppgifter.
Bevara befintliga värden om filen redan finns. Använd inte
produktionsnycklar för lokal utveckling eller preview.

Supabase kräver Docker lokalt:

```sh
npm run db:start
npm exec -- supabase migration new describe_change
npm run db:reset
npm exec -- supabase db lint --level error
npm run db:test
npm run db:stop
```

`db:reset` återställer den lokala databasen. Databasens PostgreSQL-version i
`supabase/config.toml` behöver överensstämma med driftprojektet. `seed.sql`
är enbart lokala testdata. Det finns ännu inget verksamhetsschema eller SQL-tester.

## Vad utlöser en release?

Ändringsbeslutet finns centralt i [tooling/changes.mjs](../tooling/changes.mjs).
Det körs före installation av beroenden och är täckt av regressionstester.
Regelformatet kontrolleras alltid med `npm run check:rules`: unika ID:n,
giltiga statusar, ersättningsreferenser och enbart gällande poster i `runtime/`.

| Ändring | Kontroller | Ny deployment |
| --- | --- | --- |
| `apps/web/src/`, `public/`, driftprompter | Webb | Webb |
| `rules/runtime/*.txt` | Webb | Webb |
| Appens bygg-/Vercelkonfiguration | Webb | Webb |
| Paketmanifest, låsfil, npm-/Nodekonfiguration | Webb | Webb |
| Releaseflöde eller webbens deployskript | Webb | Webb |
| `supabase/migrations/*.sql` | Lokal databas | Databasmigrationer |
| Enbart tester, fixtures eller evals | Webb | Ingen |
| Supabase-konfiguration, seed eller SQL-tester | Lokal databas | Ingen |
| Ändringsklassificeraren eller lintkonfiguration | Webb | Ingen |
| `playwright.config.ts` | Webb och webbläsare | Ingen |
| `docs/`, README, AGENTS, övriga `rules/` | Inga appkontroller | Ingen |

Nya körningskataloger och byggkonfigurationer måste läggas till i klassificeringen
med test i samma ändring. `rules/runtime/` är avsiktligt en releasegräns även när
en regeländring först kräver motsvarande kodändring. Öppna frågor och historik
ligger utanför gränsen. Runtimekod ska inte importera arbetsunderlag från `docs/`.

Ett push jämförs med tillståndet före hela pushen, inte bara senaste committen.
Första pushen granskar samtliga filer. Borttagningar och flyttar räknas också.
En uppdaterad PR jämförs med föregående PR-head för deployment: en efterföljande
docs-commit deployar inte om tidigare kodändringar. Kontrollerna granskar fortsatt
hela PR:ns förändring. Felaktig Git-historik ger fel i flödet.

```sh
npm run changes -- <base-sha> <head-sha>
```

## Koppla miljöerna en gång

1. Skapa Vercel-projektet med **Root Directory `apps/web`**, Next.js och Node 24.
   Tillåt filer utanför Root Directory så att workspace-låsfilen och reglerna
   är tillgängliga. Byggkommando är `npm run build` i appkatalogen, output `.next`.
   Vid behov sätt Install Command till `npm ci --prefix ../..`.
2. Behåll `git.deploymentEnabled: false` i appens `vercel.json`. Använd inte ett
   parallellt automatiskt Git-flöde eller Supabase Git-deploy som gör samma
   release en gång till. Projektimport kan skapa en första onboardingdeployment;
   ordinarie releaser styrs därefter av Actions.
3. Skapa separata Supabase-projekt för produktion och preview/staging. Sätt appens
   Supabase-/Claudevariabler i Vercels motsvarande miljö. Nycklarna ligger aldrig
   i regeltexterna eller Git.
4. Skapa GitHub Environments `preview` och `production`. Begränsa `production`
   till `main`. Lägg Vercel-uppgifterna nedan i respektive environment, och
   databasuppgifterna i `production`.
5. Skydda `main` med obligatorisk kontroll **verified** från Pipeline.
   Den slutförs även för rena dokumentationsändringar.

| GitHub-hemlighet | Användning |
| --- | --- |
| `VERCEL_TOKEN` | CLI-åtkomst till rätt Vercel-projekt |
| `VERCEL_ORG_ID` | Vercel team-/konto-ID |
| `VERCEL_PROJECT_ID` | Vercel projekt-ID |
| `SUPABASE_ACCESS_TOKEN` | Produktionsmigration via Supabase CLI |
| `SUPABASE_PROJECT_REF` | Produktionens Supabase-projekt |
| `SUPABASE_DB_PASSWORD` | Produktionens databaslösenord |

Repot innehåller konfiguration och instruktioner. Det visar inte om externa
projekt, hemligheter eller releasejobb är aktiverade just nu. Kontrollera faktisk
konfiguration i GitHub/Vercel separat; en lyckad push betyder inte att releasen
har lyckats. Releasejobben kräver att motsvarande miljö är konfigurerad.

## Release och återhämtning

Pull requests kör kontroller. PR:er från samma repo kan skapa webbpreview efter
godkända kontroller och relevanta ändringar. Fork-PR:er kör kontroller utan
deploymentnycklar. Preview använder Vercels previewmiljö och en separat databas.
Schemaändringar i PR:er provas lokalt i CI; detta flöde skapar inte separata
Supabase-databasgrenar för varje PR. Preview av en ny schemafunktion kräver
därför en kompatibel stagingdatabas innan funktionen kan provas där.

Push till `main` kör relevanta kontroller och därefter release. Vid databasändring
länkar CLI till produktionsprojektet, gör dry-run och tillämpar migrationerna.
Vid webbändring hämtas Vercels miljökonfiguration, ett produktionsbygge görs och
det färdiga bygget laddas upp. Databasen släpps först när båda ändras. Ett
databasfel stoppar webbdeploymenten. En databasändring ensam deployar inte webben.

Produktionsflöden köas före kontroller med `queue: max`, så att en senare snabb
kontrollkörning inte kör om en tidigare migration och väntande releaser inte
ersätter varandra. Dokumentationsändringar passerar kön utan deployment.
Se [GitHubs köhantering](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
Använd bakåtkompatibla migrationer:
lägg först till nytt schema, anpassa appen och ta bort gammalt i en senare release.
En webrollback ändrar inte databasen. Misslyckad notifikation eller ett senare
webbfel ska inte leda till att redan genomförda migrationer skrivs om.

Efter ett misslyckat jobb: återkör det från Actions, eller använd **Run workflow**
på `main` med `web`, `database` eller `both`. Det är en uttrycklig
återhämtningsrelease. En ny docs-commit ska inte behövas för att trigga om drift.
Miljövariabeländringar i Vercel kräver också en sådan explicit webbdeployment.

Flödet kör ett nyckelfritt kontrollbygge och därefter ett bygge med rätt Vercel-
miljö. CLI använder `--prebuilt` så att Vercel inte gör ytterligare ett fjärrbygge.

Tekniska referenser: [Vercels Git-konfiguration](https://vercel.com/docs/project-configuration/git-configuration),
[Vercel CLI med förbyggt resultat](https://vercel.com/docs/cli/deploying-from-cli)
och [Supabases miljö-/migrationsflöde](https://supabase.com/docs/guides/deployment/managing-environments).


## Administration

Sätt `ADMIN_ACCESS_CODE` i `apps/web/.env.local` och starta om servern. Använd en
separat slumpmässig kod eller lång lösenfras med minst 16 tecken (högst 512).
Öppna `http://localhost:3000/admin`. Tom, kort eller saknad kod håller sidan låst.
I Vercel sätts koden separat för preview och produktion; miljöbyten kräver
deployment enligt releaseflödet ovan. Det finns ingen förvald inloggningskod.

Koden kontrolleras på servern. Sessionscookien är signerad med HMAC-SHA256,
HttpOnly, SameSite Strict och Secure i produktion, med åtta timmars giltighet.
En kodändring ogiltigförklarar tidigare sessioner. Utloggning raderar cookien på
den aktuella webbläsaren; individuell serveråterkallelse och personliga konton
ingår ännu inte. Koden får aldrig läggas i URL, localStorage eller Git.
Felaktiga inloggningsförsök begränsas till åtta per 15 minuter och IP/serverinstans.
Detta är ingen gemensam spärr mellan Vercel-instanser; publik drift behöver en
beständig gemensam begränsning och betrodda proxyuppgifter för klient-IP.

Veckovyn använder Stockholmstid, måndag–söndag och en tid per dag/tidstyp eller
stängt. Ett datum kan ärva standard, ange egna tider eller stänga respektive
tidstyp oberoende. Ändrad-markering visar faktisk skillnad mot standardveckan.
För att ta bort ett undantag: välj Standard för båda tidstyperna och spara.

`gulo-hours-preview-v1` innehåller endast ett lokalt förhandsvisningsschema i
webbläsaren. Sparande kontrollerar sessionen igen, validerar hela schemat och
avvisar överskrivning om en annan flik ändrat det under redigering. Felaktig eller
blockerad lagring visas som fel. Återställning tar endast bort adminschemat;
kundens varukorg/historik påverkas inte. Utloggning rensar inte förhandsvisningen.
Kundsidans demotider ändras inte, och inga tider skickas till Google.

Supabase-repository, åtkomstkontrollerad serverlagring och kundsidans läsning av
samma schema är nästa steg. Google behöver därefter separat kontokoppling,
beslutad synkriktning och hantering av publiceringsfel enligt OPPEN-003.
Anslutningsvyn visar uttryckligen att dessa integrationer inte är anslutna.

### Beställningar och orderljud

`/admin/bestallningar` visar samma `gulo-order-memory-v1` som kundens Mina
beställningar. Spara först en demobeställning på kundsidan och öppna admin i
samma webbläsare/ursprung. Sök på produkt eller referens och filtrera på status
eller sparandedatum i Stockholm. Hämtningstid och kunduppgifter finns inte ännu.
Avbokade räknas inte i summeringarna; beloppen är lokala prisögonblicksbilder.

Markera obetald demo som betald, därefter som hämtad, eller avboka en obetald.
Mottagning och tillagning är separata steg: obekräftad → mottagning bekräftad
→ tillagas → tillagad. De kan uppdateras för obetalda eller betalda beställningar,
men inte för avbokade eller hämtade. Samma ändring syns direkt i kundens
beställning i andra öppna flikar, och finns kvar efter omladdning. Chatten får
också aktuellt mottagnings-/tillagningsläge. Detta delar inte data mellan enheter.
Varje ändring kräver granskning, bekräftelse och giltig session. Aktuellt innehåll
och status jämförs efter sessionskontrollen; ett gammalt förslag avvisas.
Utkastet i kundens varukorg bevaras. Betald/hämtad demo kan inte kundavbokas,
vare sig via GUI eller chatt. Inga verkliga betalningar kontrolleras eller görs.

Klicka **Aktivera orderljud** i admin för att låsa upp webbläsarens ljud och höra
en testsignal. Ljudet följer nya referenser oberoende av listfilter och adminvy,
även från kundsidan i en annan flik. Historik och statusändringar är tysta.
Läget överlever interna adminlänkar men behöver aktiveras igen efter omladdning.
Om ljudkontexten pausas visas det i admin. En ny signal kontrollerar sessionen;
felaktigt lokalt minne stoppar bevakningen och återläses utan historiklarm.
Detta är en lokal bevakning, utan Supabase Realtime, serverpollning eller push.
Stängd webbläsare, sovande enhet eller systemets ljudavstängning ger inga löften
om hörbar signal. Webbläsarens krav beskrivs i [MDN:s Web Audio-råd](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).

Sessionens tekniska skydd följer [OWASP:s sessionsråd](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

## Chatt och lokalt minne

`GET /api/chat` visar om Claude är konfigurerad. `POST /api/chat` validerar
meddelanden, aktuell varukorg och lokala DEMO-referenser. Verktygen ger enbart
förslag; kunden godkänner dem i gränssnittet. Priser räknas från katalogen;
påhittade roller, okända statusar och riktiga orderreferenser avvisas i demohistoriken.
Betald/hämtad och mottagnings-/tillagningsläge accepteras enbart som obetrodd
DEMO-kontext enligt ADM-006/009. De är inte verifierade betalningar eller
behörighetsbevis för riktiga ordrar. Claude felar tydligt utan att
byta till ett påhittat AI-svar. Tidsgränsen för modellen är 25 sekunder.

`gulo-order-memory-v1` lagrar versionerat demoinnehåll, referenser, prisögonblicks-
bilder, betalnings-/avbokningsstatus och mottagnings-/tillagningsläge.
Allt är lokal demodata. Inga kontaktuppgifter sparas. Det fungerar på samma
webbläsare och ursprung; annan port, inkognitoläge och rensad lagring har eget minne.
Mina beställningar kan rensa minnet, med uttrycklig information om att det inte
avbokar riktiga ordrar. Blockerad/trasig lagring ger fel och inga falska sparbesked.
Samtalet bevaras över vybyten men återställs vid omladdning; utkast och demohistorik
återställs från minnet. Flikar tar emot ändringar genom webbläsarens storage-event.

Det finns ännu inga ordertabeller, riktig orderregistrering eller betalning i denna
version. Innan publik drift behövs serverägt utkast, Supabase-lagring med kontrollerad
åtkomst, atomär order-/betalningskontroll och en gemensam beständig begränsning av
API-anrop. Chattroutens begränsade räknare gäller endast per serverinstans i demon.
Referenser från localStorage får aldrig ensamma ge åtkomst till riktiga ordrar.

Claude-adaptern följer [Anthropics Messages-verktyg](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools).
Modell-ID är konfiguration; verktygsförslag valideras mot appens katalog och regler.
