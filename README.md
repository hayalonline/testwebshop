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
- Dummy producten worden automatisch aangemaakt

## Installatie

```bash
npm install
npm run dev
```

De frontend draait op `http://localhost:5173`.
De backend API draait op `http://localhost:3001`.

## Handige scripts

```bash
npm run dev       # frontend en backend samen starten
npm run server    # alleen backend
npm run client    # alleen frontend
npm run build     # frontend productiebuild
```

## Database

De SQLite database wordt automatisch gemaakt op:

```text
server/data/webshop.sqlite
```

Bij de eerste start maakt de backend de tabellen aan en vult hij producten wanneer de producttabel leeg is.

## API gebruik

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
