# Functioneel Ontwerp – Rembro Webshop

## 1. Inleiding

### 1.1 Doel van het document
Dit document beschrijft de functionele werking van de Rembro webshop: welke functionaliteit het systeem biedt, voor welke gebruikers, en hoe de belangrijkste processen verlopen.

### 1.2 Doel van het systeem
Rembro is een webshop waarmee bezoekers producten kunnen bekijken, in een winkelwagen kunnen plaatsen en kunnen bestellen. Beheerders kunnen via een admin-omgeving producten en bestellingen beheren.

### 1.3 Doelgroepen
- **Bezoeker / klant**: bekijkt producten en plaatst bestellingen, zonder account.
- **Beheerder (admin)**: logt in op een afgeschermde admin-omgeving om producten en bestellingen te beheren.

---

## 2. Overzicht functionaliteiten

| # | Functionaliteit | Gebruiker |
|---|---|---|
| 1 | Homepage / landingspagina | Bezoeker |
| 2 | Productcatalogus bekijken | Bezoeker |
| 3 | Productdetail bekijken | Bezoeker |
| 4 | Winkelwagen beheren | Bezoeker |
| 5 | Afrekenen / bestelling plaatsen | Bezoeker |
| 6 | Contactpagina | Bezoeker |
| 7 | Inloggen als beheerder | Beheerder |
| 8 | Producten beheren (CRUD) | Beheerder |
| 9 | Bestellingen beheren | Beheerder |

---

## 3. Functionele beschrijving per onderdeel

### 3.1 Homepage (`/`)
Marketingpagina met introductie van het merk Rembro, uitgelichte producten en links naar de shop. Doel: bezoekers verleiden om door te klikken naar de shop.

### 3.2 Shop / productcatalogus (`/shop`)
- Toont een overzicht van alle beschikbare producten met afbeelding, naam, prijs en categorie.
- Bezoeker kan producten bekijken en doorklikken naar een productdetailpagina.
- Producten met voorraad 0 worden herkenbaar weergegeven (niet op voorraad).

### 3.3 Productdetail (`/product/:slugOrId`)
- Toont uitgebreide informatie over een product: naam, beschrijving, prijs, afbeelding, voorraad, categorie.
- Bezoeker kan een aantal kiezen en het product toevoegen aan de winkelwagen.
- Wanneer voorraad ontoereikend is, kan het product niet (of niet in dat aantal) worden toegevoegd.

### 3.4 Winkelwagen (`/winkelwagen`)
- Toont alle producten die de bezoeker heeft toegevoegd, met aantal, prijs per stuk en subtotaal.
- Bezoeker kan:
  - Aantallen aanpassen.
  - Producten verwijderen.
  - Het totaalbedrag van de bestelling zien.
- De inhoud van de winkelwagen blijft bewaard tussen bezoeken (lokale opslag in de browser).
- Vanuit deze pagina kan de bezoeker doorgaan naar afrekenen.

### 3.5 Afrekenen (`/afrekenen`)
- Bezoeker vult een formulier in met:
  - Naam
  - E-mailadres
  - Telefoonnummer
  - Adres, postcode, plaats
- Bij bevestigen wordt een bestelling aangemaakt:
  - De voorraad van bestelde producten wordt verlaagd.
  - De winkelwagen wordt geleegd.
  - De bezoeker krijgt een bevestiging van de bestelling.
- Validatiefouten (bijv. ontbrekende velden, ongeldig e-mailadres) worden direct getoond.

### 3.6 Contactpagina (`/contact`)
Statische pagina met contactgegevens van de webshop (geen verzendfunctionaliteit).

### 3.7 Admin – inloggen (`/admin`)
- Beheerder logt in met gebruikersnaam en wachtwoord.
- Na succesvolle login krijgt de beheerder toegang tot het beheerdashboard.
- Bij onjuiste gegevens wordt een foutmelding getoond.
- De sessie blijft actief totdat de beheerder uitlogt of de browser-sessie wordt beëindigd.

### 3.8 Admin – productbeheer
- Overzicht van alle producten (inclusief voorraad).
- Producten **toevoegen**: naam, beschrijving, prijs, afbeelding, voorraad, categorie.
- Producten **bewerken**: alle bovenstaande velden aanpasbaar.
- Producten **verwijderen**.
- Validatie: prijs en voorraad mogen niet negatief zijn.

### 3.9 Admin – bestellingenbeheer
- Overzicht van alle bestellingen met klantgegevens, totaalbedrag, status en datum.
- Bestelling **inzien**: detail met bestelde producten (regel per product, aantal, prijs).
- Bestelling **statuswijziging**: status kan worden bijgewerkt via de volgende statussen:
  1. `nieuw` – bestelling net geplaatst
  2. `in_behandeling` – wordt verwerkt
  3. `verzonden` – onderweg naar klant
  4. `afgerond` – afgehandeld
  5. `geannuleerd` – geannuleerd
- Bestelling **verwijderen**.

---

## 4. Belangrijkste gebruikersstromen

### 4.1 Bestelling plaatsen (klant)
1. Bezoeker bekijkt producten in de shop.
2. Bezoeker voegt één of meerdere producten toe aan de winkelwagen.
3. Bezoeker gaat naar de winkelwagen, controleert aantallen.
4. Bezoeker gaat naar afrekenen en vult contact- en adresgegevens in.
5. Bezoeker bevestigt de bestelling.
6. Systeem verlaagt voorraad, slaat bestelling op met status `nieuw`, en leegt winkelwagen.
7. Bezoeker ziet bevestiging.

### 4.2 Bestelling verwerken (beheerder)
1. Beheerder logt in op `/admin`.
2. Beheerder bekijkt lijst met nieuwe bestellingen.
3. Beheerder opent een bestelling om details te bekijken.
4. Beheerder wijzigt status naar `in_behandeling`, later naar `verzonden`, en uiteindelijk naar `afgerond`.

### 4.3 Product toevoegen (beheerder)
1. Beheerder logt in op `/admin`.
2. Beheerder navigeert naar productbeheer.
3. Beheerder vult productgegevens in (naam, prijs, voorraad, etc.).
4. Beheerder slaat het product op; het is direct zichtbaar in de shop.

---

## 5. Niet-functionele aspecten (functioneel relevant)

- **Taal**: de gehele webshop en admin-omgeving zijn in het Nederlands.
- **Toegankelijkheid**: klanten kunnen zonder account bestellen (geen verplichte registratie).
- **Beveiliging**: alleen de beheerder heeft toegang tot product- en bestellingenbeheer; deze functionaliteit is afgeschermd met een login.
- **Voorraadbeheer**: voorraad wordt automatisch bijgewerkt bij het plaatsen van een bestelling, zodat overselling wordt voorkomen.

---

## 6. Buiten scope (huidige versie)

- Online betalen (geen koppeling met een betaalprovider).
- Klantaccounts / inlog voor klanten.
- Verzendkoppeling / track & trace.
- E-mailnotificaties naar klant of beheerder.
- Meertaligheid (alleen Nederlands).
