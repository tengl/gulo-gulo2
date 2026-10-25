# Järvens korvfall

Regler: rules/runtime/game.txt (SPEL-001–005).
Domänen äger simulering, fångst, utfall, hopp, krypning, snubbling och
inspelningens taktkarta (score.ts). Järven springer nedför berget; korvar,
stenar och fallna träd ligger fast i marken och rör sig med SPEED, precis som
marktilen i paint.ts. Hindren läggs på inspelningens taktslag, korvarna utspritt.
Utläggningen använder seedad slump i Game, så samma ljudtid ger samma bana
oavsett bildfrekvens. De två första hindren är en sten och sedan ett fallet träd.
UI äger Canvas och Web Audio. Musikens klocka driver advanceTo med små fasta
simuleringssteg; återinför inte en separat bildrutebaserad musik-/spelklocka.
Tyst läge behåller ljudklockan. Endast ljudfel använder en tyst reservklocka.
Paus avbryter även pågående ljudladdning, och omstart återanvänder ljudbufferten.
Produktnamn matas in från webbplatsens produktinnehåll av /spel-routen.
Poängen är spelvärden, inte priser.

public/game/README.md dokumenterar ljudkälla och licens. All grafik ritas i
ui/toon.ts (SPEL-004): tecknad stil med svarta konturer och hårda skuggkanter,
inga bildfiler. Mark, träd och skuggor ingår i samma sömlösa marktile; flytta
inte träden separat. Slumpen är seedad, så grafiken blir likadan varje gång. Canvas använder dubbla pixeltätheten med logiska 480 × 640 koordinater.
Järven ritas varje bildruta av drawWolverine med munnen i origo; alla
transformer i paint.ts (lutning, hopp, krypning, snubbling) sker kring munnen,
så att den synliga munnen och kollisionspunkten alltid överensstämmer.
Figuren ska fortsatt likna Gulo Gulos logga (SPEL-001).
Byts inspelningen måste score.ts och testerna uppdateras samtidigt.
Intro är uppskjutet: en framtida video/sprite-scen kan föregå start av samma
simulering. Lägg inte själva introberättelsen i spelmotorn.
