// KAT-001–022, KAT-052–073: factual context, shared by chat and offline answers.
export const businessFacts = {
  craft:
    "Gulo Gulo är ett hantverkscharkuteri som blivit en butik med grillkiosk (Gulo Gulo Deli), där korvarna görs av Niklas på plats. Niklas grundade Gulo Gulo Charcuterie i juni 2019. Gulo Gulo Deli grundades i april 2025. Mer detaljer om tillverkningsprocessen finns inte i underlaget.",
  location:
    "Stavsätter Järvsövägen 5, Rastplats Ljusdal vid Älvbron i Ljusdal, längs Ljusnan. Följ skyltningen mot Gatukök.",
  accompaniments:
    "Alla standardwraps serveras i lokalbakat mjukt tunnbröd med picklad gurka, picklad rödlök, rostad lök och Loos-senap. Surkålsröra innehåller surkål, majonnäs, senap och svartpeppar. Stekt surkål innehåller surkål, honung och svartpeppar. Dijondressing innehåller crème fraiche, majonnäs, dijonsenap, honung, ingefärspulver, äppelcidervinäger, svartpeppar och salt.",
  meat: "Underlaget anger svenskt griskött i korvarna. BRÖL innehåller älgkött och grisspäck. TWISTED ISTER innehåller även nöt och korngryn. Fler uppgifter om djurens ursprung saknas.",
  names:
    "Produktnamnen har ett hårdrockstema: SPÄCK SABBATH–Black Sabbath, FÄN HÄJLEN–Van Halen, GIN LIZZY–Thin Lizzy, CHEEZY TOP–ZZ Top, MOTÖRWURST–Motörhead, TWISTED ISTER–Twisted Sister och GHOSTDOG–Ghost. Ingen bandförlaga till BRÖL är angiven. Företagsnamnets betydelse och fler ursprungsberättelser saknas i underlaget.",
  allergens:
    "Standardtunnbröd och rostad lök innehåller gluten. Loos-senap innehåller senap. Surkålsröra innehåller ägg och senap. Dijondressing innehåller mjölk, ägg och senap. FÄN HÄJLEN, GHOSTDOG och BRÖL innehåller sulfiter genom vin. CHEEZY TOP och GRILLOST innehåller mjölk i själva produkten. TWISTED ISTER innehåller korngryn (gluten). Uppgifter om korskontamination saknas. Kontakta personalen om allergier; jag kan inte lova att en produkt är säker för en viss person.",
};

export const productFacts: Readonly<Record<string, string>> = {
  "spack-sabbath":
    "Korv på gris med tydlig vitpeppar och lite mer kryddning än en vanlig grillkorv. Surkålsröra.",
  "fan-hajlen":
    "Korv på gris, mild men smakrik. Rostade fänkålsfrön dominerar, lite vitt vin. En italiensk variant. Stekt surkål och dijondressing.",
  "gin-lizzy":
    "Korv på gris med enbär, citronzest och lätt gin. Frisk och aromatisk, gin och tonic-känsla. Surkålsröra.",
  "cheezy-top":
    "Korv på gris med Västerbottensost och kummin. Djup och umamirik, inte het. Stekt surkål och dijondressing.",
  motorwurst:
    "Fermenterad korv på gris med frisk syra, tydlig persilja och vitlök, kryddpeppar och muskot i bakgrunden. Tysk variant med recept som bygger på Nürnberger. Torrare i konsistensen än rå färskkorv eftersom den tappar vätska vid fermenteringen. Surkålsröra.",
  "twisted-ister":
    "SM Gulds-isterband på gris, nöt och korngryn (gluten). Fermenterad och kallrökt, lagom syrlig och mustig med tydlig ingefära och rödbeta. Rödbeta i både korven och surkålsröran.",
  ghostdog:
    "Fermenterad och kallrökt korv på gris med färsk chili, ghost chili-pepparsås och rött vin, mörk av aktivt kol. Starkast på menyn; små chilibitar kan förstärka en tugga. Stekt surkål och dijondressing.",
  grillost:
    "Vegetarisk grillost av komjölk, inte vegansk. Stekt surkål och dijondressing. Inga veganska alternativ finns i underlaget.",
  brol: "Korv på älg och gris med rött vin. Stekt surkål och dijondressing. Ytterligare smak- och tillverkningsuppgifter saknas.",
  loka: "Loka innehåller enligt underlaget inte socker. Smaker som anges är citron, päron, rabarber/hallon och naturell; faktiskt lager är inte anslutet. Smak väljs på plats, fråga inte efter smak under beställning.",
  bjornasen:
    "Bärdryck med blåbär, lingon eller rabarber. Innehåller bärens naturliga socker. Smak väljs på plats om kunden inte själv har angett den. Faktiskt lager är inte anslutet.",
  "cuba-cola": "Cuba Cola innehåller socker.",
  "cuba-cola-zero": "Cuba Cola Zero innehåller enligt underlaget inte socker.",
  trocadero: "Trocadero innehåller socker.",
  "trocadero-zero": "Trocadero Zero innehåller enligt underlaget inte socker.",
  burklask:
    "Generisk burkläsk; kunden väljer sort på plats vid hämtning. Fråga inte efter sort om kunden bara vill ha läsk. Namnger kunden själv en sort bevaras den.",
  fjallol: "Alkoholfri Fjällöl är alkoholfri öl. Den är inte en läsksort.",
};
