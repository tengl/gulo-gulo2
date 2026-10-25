# Spelresurser — Järvens korvfall

SPEL-001–005, grafik-/musikrevision 2026-10-25. Här ligger bara musiken.
Grafiken ritas i koden, i `src/modules/game/ui/toon.ts`, i tecknad stil
enligt SPEL-004. Järven ritas i varje bildruta med springande ben, hopp och krypning.
Bakgrunden är en sömlös markyta som upprepas utan skarv.

## Musik

- Verk: Johann Strauss II, An der schönen blauen Donau.
- Inspelning: European Archive via Musopen. Commons anger inget orkesternamn.
- Källa: https://commons.wikimedia.org/wiki/File:Strauss,_An_der_sch%C3%B6nen_blauen_Donau.ogg
- Original: https://upload.wikimedia.org/wikipedia/commons/9/91/Strauss%2C_An_der_sch%C3%B6nen_blauen_Donau.ogg
- Licens enligt källsidan, kontrollerad 2026-10-25: CC0 1.0.
  https://creativecommons.org/publicdomain/zero/1.0/
- `blue-danube.ogg` är originalfilen; `blue-danube.mp3` är en lokal omkodning
  för webbläsare som inte kan avkoda OGG. Ingen hastighetsändring eller klippning.
- Källängd: 177.53278911564627 sekunder. Ljudbufferten loopas vid denna tid.
- `domain/score.ts` innehåller inspelningsspecifika tidsmarkörer, inte fast BPM.
  Underlaget mättes med librosa: mono 22050 Hz, onset_strength hop_length=220,
  beat_track start_bpm=180, tightness=70, trim=False. Var tredje puls, fas 1,
  valdes med hjälp av basregistrets energi. Taktslagen är analysbaserade;
  musikaliskt rubato ska bevaras, inte kvantiseras till ett jämnt tempo.
  Analysverktygen används bara vid framtagning, inga nya appberoenden krävs.
