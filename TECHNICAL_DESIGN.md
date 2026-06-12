# Technisch Ontwerp – Rembro Webshop

## 1. Inleiding

Dit document beschrijft de technische architectuur en implementatie van de Rembro webshop. Het is gericht op ontwikkelaars die de codebase onderhouden of uitbreiden.

---

## 2. Technologie-stack

| Laag | Technologie |
|---|---|
| Frontend framework | React 18.3.1 |
| Routing | React Router DOM 6.28.1 |
| Build tool / dev server | Vite 6.0.7 |
| Iconen | lucide-react |
| Styling | Custom CSS (`client/src/styles.css`) |
| Backend framework | Express 4.21.2 (Node.js, ES modules) |
| Database | SQLite via `node:sqlite` (`DatabaseSync`), geen ORM |
| API-documentatie | OpenAPI 3.0.3 + Swagger UI (`server/openapi.js`) |
| Authenticatie | HMAC-SHA256 token (stateless, single admin user) |
| Containerisatie | Docker (multi-stage build), Docker Compose |
| CI | GitHub Actions (`.github/workflows`) |

---

## 3. Architectuuroverzicht

```
┌─────────────────────┐        HTTP/JSON         ┌──────────────────────┐
│   React SPA          │ ───────────────────────▶ │   Express API         │
│   (client/src)        │ ◀─────────────────────── │   (server/index.js)   │
└─────────────────────┘                           └──────────┬───────────┘
                                                               │
                                                               ▼
                                                     ┌──────────────────┐
                                                     │  SQLite database  │
                                                     │  server/data/     │
                                                     │  webshop.sqlite   │
                                                     └──────────────────┘
```

**Development:**
- Vite dev server draait op poort 5173, proxyt `/api/*` requests naar Express op poort 3001 (`vite.config.js`).
- `npm run dev` (`scripts/dev.mjs`) start beide processen tegelijk.

**Productie (Docker):**
- Express serveert zowel de API (`/api/*`) als de gebouwde React-bundel (`/dist`) op één poort (3001).
- SQLite-bestand wordt gepersisteerd via een Docker volume (`rembro-data`).

---

## 4. Frontend

### 4.1 Structuur
```
client/src/
├── main.jsx              # Entry point
├── App.jsx                # Router setup
├── pages/                 # Route-level componenten
│   ├── HomePage.jsx
│   ├── ShopPage.jsx
│   ├── ProductPage.jsx
│   ├── CartPage.jsx
│   ├── CheckoutPage.jsx
│   ├── ContactPage.jsx
│   └── AdminPage.jsx
├── components/            # Herbruikbare UI-componenten (Layout, Header, Footer, etc.)
├── context/
│   └── CartContext.jsx    # Globale winkelwagen-state via React Context
├── hooks/
│   └── useProducts.js     # Data fetching hook voor producten
├── services/
│   └── api.js             # Fetch-wrapper voor API-calls
├── utils/                  # Hulpfuncties
└── styles.css              # Globale styling
```

### 4.2 Routing
| Pad | Component | Toegang |
|---|---|---|
| `/` | HomePage | Publiek |
| `/shop` | ShopPage | Publiek |
| `/product/:slugOrId` | ProductPage | Publiek |
| `/winkelwagen` | CartPage | Publiek |
| `/afrekenen` | CheckoutPage | Publiek |
| `/contact` | ContactPage | Publiek |
| `/admin` | AdminPage | Login vereist (client-side check) |

### 4.3 State management
- **CartContext** (`context/CartContext.jsx`): bevat winkelwagen-items, functies om toe te voegen/verwijderen/aantal te wijzigen, en het totaalbedrag. Persisteert naar `localStorage` zodat de winkelwagen behouden blijft na een refresh.
- **AdminPage**: bewaart het auth-token in `sessionStorage` na inloggen; token wordt meegestuurd als `Authorization: Bearer <token>` bij admin-API-calls.

### 4.4 API-service (`services/api.js`)
Centrale fetch-wrapper die:
- Basis-URL (`/api`) en JSON-headers toevoegt.
- Foutafhandeling normaliseert (HTTP-fouten → JS-exceptions met leesbare berichten).
- Optioneel een Bearer-token meegeeft voor admin-endpoints.

---

## 5. Backend

### 5.1 Structuur
```
server/
├── index.js              # Entry point: Express-app, middleware, route-registratie, static serving
├── openapi.js             # OpenAPI-specificatie + Swagger UI route
├── routes/
│   ├── auth.js            # POST /api/auth/login
│   ├── products.js        # /api/products CRUD
│   └── orders.js           # /api/orders CRUD + status-update
├── db/
│   ├── database.js         # Schema-definitie, DatabaseSync-init
│   └── seed.js              # Seed-data (6 demoproducten)
├── utils/
│   ├── auth.js              # Token generatie/validatie, requireAdmin-middleware
│   └── validation.js        # Input-validatie/conversie, HTTP-errorhelpers
└── data/
    └── webshop.sqlite        # SQLite-database (runtime-gegenereerd)
```

### 5.2 Middleware-keten (`server/index.js`)
1. `cors()` – staat cross-origin requests toe (nodig in dev waar frontend op andere poort draait).
2. `express.json()` – parsed JSON request bodies.
3. Route-registratie: `/api/auth`, `/api/products`, `/api/orders`, `/api-docs`.
4. Statische bestanden uit `/dist` (productie).
5. Centrale errorhandler die fouten omzet naar JSON `{ error: message }`-responses met passende HTTP-status.

### 5.3 Authenticatie & autorisatie
- **Login** (`POST /api/auth/login`):
  - Input: `{ username, password }`.
  - Vergelijkt met `ADMIN_USER` / `ADMIN_PASSWORD` (env vars, defaults `admin` / `admin123`).
  - Bij match: genereert token = `HMAC-SHA256(ADMIN_SECRET, "username:password")`, hex-encoded.
  - Response: `{ token, user: { username } }`.
- **requireAdmin middleware** (`utils/auth.js`):
  - Leest `Authorization: Bearer <token>` header.
  - Herberekent het verwachte token op basis van env-credentials en vergelijkt.
  - Bij mismatch/ontbreken: `401 Unauthorized`.
- Geen sessies, geen database-opslag van tokens (volledig stateless, herberekenbaar).
- **Beveiligingsoverweging**: het token is deterministisch afgeleid van vaste credentials; geschikt voor een single-admin demo-opzet, niet voor multi-user productieomgevingen met wachtwoordwijzigingen zonder herstart.

### 5.4 Database (`server/db/database.js`)
SQLite via Node's ingebouwde `node:sqlite` (`DatabaseSync`), zonder ORM. Schema wordt bij opstarten aangemaakt indien niet bestaand (`CREATE TABLE IF NOT EXISTS`).

**Tabellen:**

```sql
products
├── id            INTEGER PRIMARY KEY
├── name          TEXT NOT NULL
├── slug          TEXT UNIQUE NOT NULL
├── description   TEXT
├── price         REAL CHECK (price >= 0)
├── image         TEXT
├── stock         INTEGER CHECK (stock >= 0)
├── category      TEXT
├── created_at    TIMESTAMP
└── updated_at    TIMESTAMP

orders
├── id            INTEGER PRIMARY KEY
├── customer_name TEXT NOT NULL
├── email         TEXT NOT NULL
├── phone         TEXT
├── address       TEXT NOT NULL
├── postal_code   TEXT NOT NULL
├── city          TEXT NOT NULL
├── total_amount  REAL CHECK (total_amount >= 0)
├── order_status  TEXT  -- nieuw | in_behandeling | verzonden | afgerond | geannuleerd
├── created_at    TIMESTAMP
└── updated_at    TIMESTAMP

order_items
├── id            INTEGER PRIMARY KEY
├── order_id      INTEGER REFERENCES orders(id) ON DELETE CASCADE
├── product_id    INTEGER REFERENCES products(id)
├── product_name  TEXT      -- snapshot t.b.v. historie
├── quantity      INTEGER CHECK (quantity > 0)
├── unit_price    REAL       -- snapshot prijs op besteltijdstip
└── total_price   REAL       -- quantity * unit_price
```

**Seed-data** (`server/db/seed.js`): bij lege database worden 6 demoproducten ingeladen (Urban Rugzak, Minimal Desk Lamp, Linnen Weekendtas, Keramische Mok Set, Wireless Charger Dock, Merino Sjaal).

### 5.5 API-eindpunten

| Methode | Pad | Auth | Beschrijving |
|---|---|---|---|
| GET | `/api/health` | – | Health check |
| POST | `/api/auth/login` | – | Inloggen, retourneert token |
| GET | `/api/products` | – | Lijst van alle producten |
| GET | `/api/products/:id` | – | Eén product op id of slug |
| POST | `/api/products` | admin | Nieuw product aanmaken |
| PUT | `/api/products/:id` | admin | Product bijwerken |
| DELETE | `/api/products/:id` | admin | Product verwijderen |
| GET | `/api/orders` | admin | Lijst van alle bestellingen |
| GET | `/api/orders/:id` | admin | Bestelling + orderregels |
| POST | `/api/orders` | – | Nieuwe bestelling plaatsen |
| PUT | `/api/orders/:id/status` | admin | Status bijwerken |
| DELETE | `/api/orders/:id` | admin | Bestelling verwijderen |
| GET | `/api-docs` | – | Swagger UI |
| GET | `/api-docs/openapi.json` | – | OpenAPI-spec (JSON) |

### 5.6 Orderverwerking (transactie)
`POST /api/orders` (zie `server/routes/orders.js`):
1. Valideer body (klantgegevens + lijst van `{ productId, quantity }`).
2. Start SQLite-transactie (`BEGIN`).
3. Voor elk item: controleer of voorraad voldoende is; bereken `unit_price`/`total_price` op basis van actuele productprijs.
4. Verlaag `stock` per product.
5. Sla `orders`-record en bijbehorende `order_items` op.
6. Commit transactie; bij elke fout: `ROLLBACK` en `400`/`409`-foutrespons.

### 5.7 Validatie & foutafhandeling (`server/utils/validation.js`)
- Helperfuncties voor type-conversie/validatie (bv. numerieke velden, verplichte strings, e-mailformaat).
- HTTP-foutwrapper (`HttpError` of vergelijkbaar) die status + Nederlandstalige foutmelding draagt, opgevangen door de centrale errorhandler in `server/index.js`.
- Velden uit de database (snake_case) worden bij API-respons omgezet naar camelCase voor de frontend.

### 5.8 OpenAPI / Swagger
- `server/openapi.js` bevat de volledige OpenAPI 3.0.3-specificatie (schemas voor `Product`, `Order`, `OrderItem`, foutresponses, bearer-auth security scheme).
- Swagger UI wordt geserveerd op `/api-docs`, ruwe spec op `/api-docs/openapi.json`.

---

## 6. Configuratie & omgevingsvariabelen

| Variabele | Omschrijving | Default |
|---|---|---|
| `PORT` | Poort van de Express-server | `3001` |
| `ADMIN_USER` | Gebruikersnaam admin | `admin` |
| `ADMIN_PASSWORD` | Wachtwoord admin | `admin123` |
| `ADMIN_SECRET` | HMAC-secret voor tokengeneratie | `local-admin-secret` |

Geconfigureerd via `.env` (zie `.env.example`).

---

## 7. Build & deployment

### 7.1 Scripts (root `package.json`)
| Script | Werking |
|---|---|
| `npm run dev` | Start client (Vite) + server (Express) parallel via `scripts/dev.mjs` |
| `npm run server` | Start alleen Express-server |
| `npm run client` | Start alleen Vite dev-server |
| `npm run build` | Bouwt productie-bundel van de React-app naar `/dist` |
| `npm run preview` | Preview van de productiebundel |

### 7.2 Docker
- **Multi-stage Dockerfile**:
  1. `deps` – installeert npm-dependencies.
  2. `build` – voert `npm run build` uit (genereert `/dist`).
  3. `runtime` – kopieert enkel productiebestanden + `/dist`, draait op Node 24-slim.
- **docker-compose.yml**:
  - Eén service (Express-app), exposeert poort 3001.
  - Volume `rembro-data` koppelt aan `/app/server/data` voor persistente SQLite-opslag.
  - Omgevingsvariabelen via `.env`.

### 7.3 CI
- GitHub Actions workflows in `.github/workflows` (build/lint/test-checks bij push/PR).

---

## 8. Beveiligingsoverwegingen

- **SQL-injectie**: voorkomen door gebruik van prepared statements (`node:sqlite`).
- **CORS**: ingeschakeld voor ontwikkelgemak; in productie kan dit worden beperkt tot het eigen domein.
- **Adminauthenticatie**: eenvoudig HMAC-token-mechanisme zonder sessiebeheer of wachtwoord-hashing in database (er is namelijk geen gebruikersopslag — credentials komen uit environment variables). Geschikt voor kleinschalige/demo-toepassing; bij verdere groei (meerdere beheerders, wachtwoordwijzigingen) is een volwaardig identity-systeem (bv. gehashte wachtwoorden in DB + sessies/JWT) aan te raden.
- **Invoervalidatie**: alle schrijf-endpoints valideren input via `server/utils/validation.js` voordat data de database bereikt.

---

## 9. Mogelijke toekomstige uitbreidingen (technisch)

- Vervangen van SQLite door een netwerk-database (PostgreSQL/MySQL) bij groei naar meerdere instanties.
- Toevoegen van een betaalprovider-integratie (bv. Mollie/Stripe) in het orderproces.
- Uitbreiden van authenticatie naar meerdere admin-gebruikers met gehashte wachtwoorden.
- E-mailnotificaties (bv. via een mailprovider) bij orderstatuswijzigingen.
