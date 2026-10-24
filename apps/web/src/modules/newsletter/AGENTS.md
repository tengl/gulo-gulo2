# Nyhetsbrev

Anmälan till nyhetsbrevet enligt WEBB-013 i `rules/runtime/site.txt`.
`domain/signup.ts` validerar adress, samtycke och fällan för formulärbotar.
Brevo-adaptern i `server/brevo/` begär dubbel bekräftelse; Brevo äger listan och
avregistreringen. Spara inga adresser i appen och logga dem inte.
