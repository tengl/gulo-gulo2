Delad presentation och små tekniska hjälpfunktioner utan verksamhetsregler.
Lägg domänbegrepp i den modul som äger dem. Skapa inte ett allmänt `utils`-lager.

`Sheet` äger native dialog, scrollås och fokusåterställning (UX-010–012).
Öppningsanimation och backdrop ligger i globals.css och respekterar minskad
rörelse. Lägg inte fördröjningar runt stängning eller bekräftelse som kan ändra
anroparens behörighets-/ändringskontroller.
