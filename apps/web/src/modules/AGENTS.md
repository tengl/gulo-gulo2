# Verksamhetsmoduler

Läs SYS-004–005 och relevanta filer under `rules/runtime/` och `rules/proposals/`.

När en funktion införs, bygg endast de delar som behövs:

```text
<område>/
  index.ts             publikt API för domän/use cases
  domain/              typer, värdeobjekt, deterministiska regler
  application/         use cases och portar till externa beroenden
  ui.ts                publikt API för modulens UI (klientkomponenter)
  ui/                  funktionens React-komponenter, separat från index.ts
```

Andra moduler och routes importerar bara `@/modules/<område>` eller
`@/modules/<område>/ui`; ESLint stoppar djupa importer. Inom modulen används
relativa importer. `index.ts` får inte exportera UI, eftersom Node-testerna
läser domänen utan React. `apps/web/package.json` anger `sideEffects`, så att
oanvända delar av en `ui.ts` inte hamnar i fel sidas bundle; lägg inte kod med
sidoeffekter vid import i moduler.

Domänlagret beror bara på eget område och andra modulers publika domän-API.
Use cases anropar portar; de importerar inte konkreta adaptrar i `server/`.
Routes skapar adaptrarna och kopplar dem till use cases. Adaptrar beror på
portarna, inte tvärtom. Undvik cirkulära modulberoenden och generella bas-klasser.

Varje meningsfull regelkontroll eller test hänvisar till gällande regel-ID.
Håll produkternas fakta och prisunderlag samlat i katalogmodulen när det beslutas;
skapa inte separata handskrivna kopior i UI, prompter och orderkod.
