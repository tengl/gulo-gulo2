Delad presentation och små tekniska hjälpfunktioner utan verksamhetsregler.
Lägg domänbegrepp i den modul som äger dem. Skapa inte ett allmänt `utils`-lager.

`Sheet` äger native dialog, scrollås och fokusåterställning (UX-010–012).
Öppnings-/stängningsanimation och backdrop ligger i globals.css och respekterar
minskad rörelse. Omslut villkorligt renderade dialoger med `SheetPresence`:
anroparens onClose/bekräftelse körs direkt och får neka stängning. Bara efter
godkänd stängning behålls presentationen inert tills CSS-animationen avslutats.
Skjut aldrig upp behörighets-/ändringskontroller eller mutationer till efter
animationen. Sheet städar scrollås och återställer fokus vid avmontering; har öppnaren
blivit dold används `main[tabindex]`. En stängning under öppningen fortsätter
från ungefär samma läge. `createId` ersätter `crypto.randomUUID`, som saknas
över vanlig http i lokalt nätverk.
