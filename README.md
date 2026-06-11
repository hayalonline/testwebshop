# Test Webshop

Een complete basis-webshop met React frontend, Express REST API en SQLite database.

## Functionaliteit

- Home, shop, productdetail, winkelwagen, afrekenen en contactpagina
- Producten bekijken en toevoegen aan de winkelwagen
- Aantallen wijzigen en producten verwijderen
- Bestelling plaatsen zonder betaalprovider
- Orders worden opgeslagen in SQLite met orderregels
- Product CRUD API
- Order API inclusief status wijzigen
- Adminpagina met login voor product- en orderbeheer
- Dummy producten worden automatisch aangemaakt

## Installatie

```bash
npm install
npm run dev
```

De frontend draait op `http://localhost:5173`.
De backend API draait op `http://localhost:3001`.
Swagger/OpenAPI documentatie draait op `http://localhost:3001/api-docs`.

Adminpagina:

```text
http://localhost:5173/admin
```

Standaard lokale login:

```text
Gebruiker: admin
Wachtwoord: admin123
```

Je kunt dit aanpassen met environment variables:

```bash
ADMIN_USER=mijnadmin ADMIN_PASSWORD=sterkwachtwoord npm run dev
```

## Handige scripts

```bash
npm run dev       # frontend en backend samen starten
npm run server    # alleen backend
npm run client    # alleen frontend
npm run build     # frontend productiebuild
```

## Docker deployment op VPS

Deze app kan als één container draaien. In productie serveert Express zowel de API als de gebouwde React frontend.

### 1. Build en start lokaal of op je VPS

```bash
docker compose up -d --build
```

Daarna is de app bereikbaar op:

```text
http://SERVER_IP:3001
```

Swagger staat op:

```text
http://SERVER_IP:3001/api-docs
```

### 2. Admin credentials aanpassen

Maak op je VPS een `.env` bestand naast `docker-compose.yml`:

```bash
cp .env.example .env
nano .env
```

Vul minimaal sterke waarden in:

```text
ADMIN_USER=admin
ADMIN_PASSWORD=een-sterk-wachtwoord
ADMIN_SECRET=een-lange-random-secret
```

### 3. Database persistent houden

SQLite wordt opgeslagen in het Docker volume `rembro-data`, gekoppeld aan:

```text
/app/server/data
```

Daardoor blijven producten en orders behouden wanneer je de container opnieuw start.

### 4. Handige Docker commando's

```bash
docker compose logs -f
docker compose restart
docker compose down
docker compose up -d --build
```

Voor een echte domeinnaam zet je meestal Nginx Proxy Manager, Caddy, Traefik of Nginx voor deze container en proxy je naar `http://127.0.0.1:3001`.

## Automatische deployment via GitHub Actions

Er staat een workflow in `.github/workflows/deploy.yml`.

Deze workflow draait automatisch bij elke push naar `main`, bijvoorbeeld wanneer een pull request naar `main` wordt gemerged. De workflow uploadt de repo naar de VPS en voert daar uit:

```bash
docker compose up -d --build
```

Maak in GitHub bij `Settings > Secrets and variables > Actions` deze repository secrets aan:

```text
VPS_HOST=194.31.150.130
VPS_USER=root
VPS_APP_DIR=/opt/rembro
VPS_SSH_KEY=<private ssh key met toegang tot de VPS>
```

`VPS_APP_DIR` is optioneel in de workflow; als deze leeg is gebruikt hij `/opt/rembro`.

Belangrijk: op de VPS moet in `/opt/rembro/.env` al een productieconfig staan, bijvoorbeeld:

```text
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
ADMIN_SECRET=een-lange-random-secret
```

De workflow overschrijft `.env` niet en bewaart de SQLite database via het Docker volume `rembro-data`.

## Database

De SQLite database wordt automatisch gemaakt op:

```text
server/data/webshop.sqlite
```

Bij de eerste start maakt de backend de tabellen aan en vult hij producten wanneer de producttabel leeg is.

## API gebruik

Voor beheeracties zoals producten aanmaken/wijzigen/verwijderen en orders bekijken/statussen wijzigen heb je een admin token nodig:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

Gebruik de waarde uit `token` daarna als bearer token:

```bash
curl http://localhost:3001/api/orders \
  -H "Authorization: Bearer JOUW_TOKEN"
```

### Producten

```http
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

Voorbeeld product aanmaken:

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Nieuwe tas\",\"slug\":\"nieuwe-tas\",\"description\":\"Stevige shopper\",\"price\":49.95,\"image\":\"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80\",\"stock\":12,\"category\":\"Accessoires\"}"
```

### Orders

```http
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id/status
DELETE /api/orders/:id
```

Voorbeeld orderstatus wijzigen:

```bash
curl -X PUT http://localhost:3001/api/orders/1/status \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"verzonden\"}"
```

Toegestane statussen: `nieuw`, `in_behandeling`, `verzonden`, `afgerond`, `geannuleerd`.

## Projectstructuur

```text
client/
  src/
    components/
    context/
    pages/
    services/
server/
  data/
  db/
  routes/
  utils/
```
