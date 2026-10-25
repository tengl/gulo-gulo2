# Spelresurser — Järvens korvfall

SPEL-001–005, grafik-/musikrevision 2026-10-25. Bilderna skapades med inbyggda
image_gen-verktyget och packades till WebP med bibehållen transparens.
Järven består av två lika stora celler (stängd/öppen mun). Bakgrunden ritas
som en sammanhängande markyta; skarven tonas i Canvas innan den upprepas.

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

## Slutliga bildprompter (inbyggt image_gen)

### wolverine-dive.webp

Referens: projektets `logo-light.png`. Transparent background: true.

Create a production game sprite sheet, transparent background, 1536x1024 landscape. Two equal square-ish cells side by side, left half and right half, exactly the same wolverine animal and pose at the same scale and same location within each half. Use attached logo ONLY as reference for facial markings and warm tan/dark chocolate palette, do not include logo typography. Semi-realistic hand-painted 1990s cinematic adventure-game art inspired by Full Throttle, detailed shaggy fur, convincing mustelid anatomy, chunky powerful shoulders, small rounded ears, pale lateral flank bands, brown-black fur, bushy short tail. NOT a bear, NOT a human mascot, no clothes. Whole wolverine falling/diving HEAD FIRST TOWARDS THE BOTTOM OF THE IMAGE, body behind the head towards top, tail trails toward top edge, two muscular forepaws reaching forwards beside head towards bottom edge, rear paws trailing behind. Camera above and slightly in front sees the face at bottom and the back/body receding toward top; fierce playful hungry expression, credible long muzzle. Both forepaws and claws clearly visible, anatomically plausible. Left cell mouth mostly closed. Right cell same exact pose but jaw opened for a bite, teeth visible. This is TWO ANIMATION FRAMES, not two animals interacting. Each figure centered with 12% transparent margin on all sides. Head near 72% cell height, forepaws near 80%, tail near 15%. Full body visible. Warm rim lighting on left, subtle cool shadows right. Rich painted texture, no pixel scanlines, no ground, no shadow on ground, no text, no border, no frame labels. Actual transparent alpha.

### halsingland-slope.webp

Transparent background: false.

Production background texture for a vertically scrolling downhill falling game, portrait 1024x1536. A gorgeous detailed hand-painted cinematic 1990s adventure game environment, Full Throttle-inspired painterly realism, grounded natural shapes NOT low-poly triangles. Bird's-eye / high oblique view looking directly down an endless steep forested mountain slope in Hälsingland Sweden, NO SKY, NO HORIZON, NO CLIFF WALLS, NO CANYON, NO FLOATING OBJECTS. Continuous mossy granite and heather forest floor fills entire image edge to edge. A broad irregular open rocky grassy corridor takes central 55% of image, darker woodland clusters mainly left and right 25%. The slope runs vertically down the image. Many mature Norway spruce and Scots pine rooted in that ground, a few white-barked birches with golden leaves. Trees shown from above in perspective, their crowns rise toward upper left and their roots and contact shadows are visibly connected to the same continuous terrain. Beautifully shaped uneven layered needles, red-brown pine trunks, moss cushions, lichen on weathered rounded granite boulders, roots, tiny ferns, rusty bracken, a few fallen trunks lying flat against the ground. Fine warm afternoon side lighting, cast shadows consistently to bottom right. Rich deep pine greens, gray-blue stone, ochre light and golden brown ground. Atmospheric depth but clear ground plane. No buildings, ski lifts, cables, people, animals, sausages, lettering, UI. Seamlessly vertically TILEABLE, matching woodland density, light and terrain at top and bottom edges, no vignette or border. Consistent scale throughout for infinite scrolling, no vanishing point. High art direction quality, handmade painted textures, visually lush but central corridor remains sufficiently calm for a small animal sprite to be readable.
