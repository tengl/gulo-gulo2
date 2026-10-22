# Google Business Profile

Planerad adapter för `rules/runtime/business-hours.txt`, särskilt OPPEN-001.
Ännu inte implementerad eller ansluten till ett Google-konto.

My Business Business Information API har `locations.patch` för exempelvis
`regularHours` och `specialHours`. Använd en explicit `updateMask` för de fält
som administratören ändrar. Lägg OAuth och API-anrop här bakom modulens port.
Appens personalinloggning och behörigheten till Googles företagsprofil hanteras
separat. Lägg aldrig OAuth-hemligheter i klientkod eller regeltexter.

Före implementation behövs beslut om synkriktning, behörighet och tidsdetaljer
och hur fel/återförsök ska visas. Googles projekt behöver API-åtkomst och en
OAuth-koppling till kontot som har rättigheter till rätt verksamhetsprofil.

Referenser:

- [Uppdatera verksamhetsdata](https://developers.google.com/my-business/content/location-data)
- [Location-resursen](https://developers.google.com/my-business/reference/businessinformation/rest/v1/locations)
- [API-förutsättningar](https://developers.google.com/my-business/content/prereqs)
