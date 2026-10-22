# Identitet och åtkomst

Första administrationen använder superadmin-kod enligt BEH-005. Rollmatris
och personliga konton är fortfarande öppna; Supabase Auth är ett förslag.

Regelunderlag: `rules/runtime/access.txt`. Läs status på varje post innan implementation.

`ui/AdminLogin.tsx` skickar koden till `/api/admin/session`. Serveradaptern
`server/access/session.ts` äger kodkonfiguration och signerade sessioner.
`app/admin/page.tsx` kontrollerar sessionen före rendering. Kod får aldrig
skickas i sidans props eller sparas i localStorage. Sessionssäkerhet testas i
`tests/security/` med Node-villkoret `react-server`, som ingår i `npm test`.
