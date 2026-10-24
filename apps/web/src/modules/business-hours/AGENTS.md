# Öppettider och publicering

Redigerbara öppettider/hämtningstider och fönster för att ta emot beställningar
samma dag: standardvecka, datumundantag
och innevarande vecka med tydliga avvikelsemarkeringar. Ett framtida use case
för publicering till Google ska anropa en port med adapter i server/google-business.
Synkriktning mot Google och detaljer om tidsgränser är ännu öppna.

Regelunderlag: `rules/runtime/business-hours.txt`. Läs status på varje post innan implementation.

`domain/demo-hours.ts` äger ordinarie demotider enligt OPPEN-016–017.
`ui/HoursOverview.tsx` visar öppettider med loggan; i chatten scrollar huvudet
med introduktionen enligt OPPEN-016.
`ui/OrderingHours.tsx` visar beställningsfönstret inne i chatt och meny enligt
OPPEN-016; bannern stannar synlig vid scroll även efter första meddelandet. Samma fakta ges till
Claude. Detta är inte kapacitetskontroll eller redigerbar driftkonfiguration.
`domain/schedule.ts` äger standardvecka, datumundantag, validering och effektiv
avvikelse enligt OPPEN-004–009 / ADM-003. `ui/HoursAdmin.tsx` är veckovyn;
`HoursEditor.tsx` redigerar, `useSchedulePreview.ts` hanterar lokal lagring.
Adminschemat är en uttrycklig lokal förhandsvisning enligt ADM-002, frikopplad
från kunddemon. Google-publicering och Supabase-lagring är inte implementerade.
Byt inte ut kundens tider mot webbläsarens schema vid senare serveranslutning.
UI får inte skapa egna tider eller påstå att lokal lagring är publicering.
