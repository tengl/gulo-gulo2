# Webbapplikationen

Läs `rules/system.txt` SYS-003–007 och regelområdet som berörs av ändringen.

- `src/app/`: Next.js-routes, layout och sammansättning av use cases/adaptrar.
- `src/modules/<område>/`: områdets domän, use cases och funktionens UI.
- `src/server/`: Supabase, Claude och andra externa adaptrar.
- `src/shared/`: endast små gemensamma presentations-/teknikdelar.
- Placera tester intill koden som `<namn>.test.ts` eller i `__tests__/`.
- Använd `import "server-only"` i moduler som läser hemligheter eller använder
  privilegierade integrationer. Klientkomponenter får bara använda säkra DTO:er
  och uttryckligt klientgränssnitt. Validera all data vid servergränsen.

Grunden innehåller en avsiktligt liten startsida. Beställningsfunktioner,
datamodell, autentisering och modellanrop återstår att implementera efter beslut.
