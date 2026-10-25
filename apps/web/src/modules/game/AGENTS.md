# Järvens korvfall

Regler: rules/runtime/game.txt (SPEL-001–005).
Domänen äger simulering, fångst, utfall och inspelningens taktkarta (score.ts).
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
Järvens två spriteceller är samma dykställning med stängd/öppen mun.
Munnens synliga position och kollisionspunkt ska alltid överensstämma;
paint.ts placerar CELL.mouthX/mouthY på kollisionspunkten.
Byts inspelningen måste score.ts och testerna uppdateras samtidigt.
Intro är uppskjutet: en framtida video/sprite-scen kan föregå start av samma
simulering. Lägg inte själva introberättelsen i spelmotorn.
