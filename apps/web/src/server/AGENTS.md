# Serveradaptrar

Läs SYS-001, SYS-004–007 och relevanta integrations-/verksamhetsförslag.

- `claude/`: modellklient, driftprompter och översättning från modellverktyg
  till validerade use cases. Modellnamn är konfiguration.
- `supabase/`: planerad plats för klienter, repository-adaptrar och genererade
  databastyper; de är ännu inte implementerade.
- `access/`: serverkonfigurerad superadmin-kod och signerad sessionscookie.
- `notifications/` / `brevo/`: planerade mejl-, nyhetsbrevs- och pushadaptrar.
  Brevo är valt för nyhetsbrev och mejl enligt SYS-001.
- `google-business/`: OAuth och Business Profile API för öppettider. Appens
  inloggning och Googles kontokoppling är separata behörighetsgränser; här finns
  hittills bara instruktioner, inga OAuth-/API-anrop.

Skapa SDK-klienter först när de används. Hemligheter hanteras här via ett samlat
konfigurationsgränssnitt när integrationerna byggs. Markera servermoduler med
`server-only`. Ett importtillfälle ska inte kräva kontakt med externa tjänster.

Verksamhetsvärden och statusövergångar hör i ägande modul och dess regeltext.
Integrationens fel ska kunna särskiljas från en redan utförd databasåtgärd.
