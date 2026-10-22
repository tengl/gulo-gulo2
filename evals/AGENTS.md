`conversation.json` innehåller manuella Claude-scenarier för den implementerade
konversationsmodulen. De körs inte av npm test eller CI; automatiserad evalrunner
finns ännu inte. Nyckelfria domän- och transporttester ligger i modulerna och tests/.
Varje scenario ska ange regel-ID, kundindata, förväntad åtgärd och otillåtna åtgärder.
Använd syntetiska kunduppgifter. Kör modellberoende evals separat från vanliga tester.
Prompter som används i drift hör hemma i `apps/web/src/server/claude/`, inte här.
