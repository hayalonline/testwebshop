# Beveiligingsaudit – Rembro Webshop

**Type:** White-box broncode-analyse  
**Stack:** Node.js 24 + Express 4 · React 18 + Vite · SQLite (`node:sqlite`) · Custom HMAC-auth  
**Taal:** Nederlands (AVG/GDPR van toepassing)  
**Datum:** Juni 2026  
**Auditor:** Senior Application Security Engineer (white-box review)

---

## Samenvatting

De Rembro-webshop heeft een heldere structuur en een aantal goede basismaatregelen (geparameteriseerde SQL-queries, server-side prijsberekening, transactionele orderverwerking). Op het gebied van authenticatieontwerp en HTTP-beveiliging zijn echter drie **kritieke** en vijf **hoge** bevindingen aangetroffen die direct risico vormen voor klantgegevens en de administratieve toegang.

| Ernst | Aantal |
|---|---|
| Kritiek | 3 |
| Hoog | 5 |
| Gemiddeld | 8 |
| Laag | 4 |
| Info | 1 |
| **Totaal** | **21** |

**Top 5 risico's in begrijpelijke taal:**

1. Het admin-token is eeuwig geldig, volledig voorspelbaar en nooit te invalideren — één lek betekent permanente admintoegang.
2. Standaardwachtwoord `admin/admin123` staat hardgecodeerd in de broncode én wordt getoond op de inlogpagina; in iedere misconfigureerde productie-omgeving is de applicatie direct te overnemen.
3. Er is geen beperking op het aantal inlogpogingen — een aanvaller kan onbeperkt wachtwoorden uitproberen.
4. CORS staat volledig open voor alle origins; een kwaadaardige website kan admin-API-aanroepen doen in de browser van een ingelogde beheerder.
5. Er zijn geen beveiligingsheaders ingesteld (geen CSP, geen HSTS, geen X-Frame-Options) — de adminpagina is vatbaar voor clickjacking en er is geen XSS-barrière.

---

## Aanvalsoppervlak (Attack Surface Map)

| Eindpunt | Methode | Auth vereist | Opmerking |
|---|---|---|---|
| `/api/health` | GET | Nee | Publiek |
| `/api-docs/openapi.json` | GET | Nee | Volledige API-schema, publiek |
| `/api-docs` | GET | Nee | Swagger UI met "Try it out", publiek |
| `/api/auth/login` | POST | Nee | Admin-inlog, geen rate limiting |
| `/api/products` | GET | Nee | Volledige productlijst |
| `/api/products/:id` | GET | Nee | Product op id of slug |
| `/api/products` | POST | Admin | Product aanmaken |
| `/api/products/:id` | PUT | Admin | Product bijwerken |
| `/api/products/:id` | DELETE | Admin | Product verwijderen |
| `/api/orders` | GET | Admin | Alle bestellingen + klant-PII |
| `/api/orders/:id` | GET | Admin | Bestelling + orderregels |
| `/api/orders` | POST | **Nee** | Bestelling plaatsen (publiek) |
| `/api/orders/:id/status` | PUT | Admin | Statuswijziging |
| `/api/orders/:id` | DELETE | Admin | Bestelling verwijderen |
| `/` (SPA + alle routes) | GET | Nee | Statische bestanden incl. `/admin` |

---

## Bevindingentabel

| ID | Ernst | Titel | Locatie | Categorie |
|---|---|---|---|---|
| SEC-001 | **Kritiek** | Token-vergelijking niet timing-safe | `server/utils/auth.js:22` | Authenticatie |
| SEC-002 | **Kritiek** | Deterministisch, herbruikbaar, nooit vervallend admin-token | `server/utils/auth.js:8-13` | Authenticatie |
| SEC-003 | **Kritiek** | Hardgecodeerde standaardwachtwoorden + hint op inlogpagina | `server/utils/auth.js:4-6`, `AdminPage.jsx:232` | Authenticatie / Secrets |
| SEC-004 | **Hoog** | Geen rate limiting op inlogendpunt | `server/routes/auth.js:8-24` | Authenticatie |
| SEC-005 | **Hoog** | Wildcard CORS — alle origins toegestaan | `server/index.js:19` | API-beveiliging |
| SEC-006 | **Hoog** | Geen beveiligingsheaders (geen helmet, geen CSP, geen HSTS) | `server/index.js` | HTTP-headers |
| SEC-007 | **Hoog** | Race condition in voorraadvermindering — overselling mogelijk | `server/routes/orders.js:82-131` | Bedrijfslogica |
| SEC-008 | **Hoog** | Geen idempotentie — dubbelklik maakt dubbele bestelling | `server/routes/orders.js:78-137` | Bedrijfslogica |
| SEC-009 | **Gemiddeld** | `SELECT *` in orderverwerking lekt alle productkolommen | `server/routes/orders.js:84` | Injectie / Data |
| SEC-010 | **Gemiddeld** | Geen maximale stringlengte — opslag-DoS via API | `server/utils/validation.js:5-9` | Invoervalidatie |
| SEC-011 | **Gemiddeld** | Validatie staat prijs = 0 toe — gratis producten mogelijk | `server/utils/validation.js:12-18` | Invoervalidatie |
| SEC-012 | **Gemiddeld** | Onbeperkt aantal orderregels — event-loop DoS via publiek endpoint | `server/routes/orders.js:44-60` | Bedrijfslogica |
| SEC-013 | **Gemiddeld** | Swagger UI via CDN zonder SRI + `persistAuthorization: true` | `server/openapi.js:323-329` | Supply chain / API |
| SEC-014 | **Gemiddeld** | Foutafhandeling logt volledige stacktraces | `server/index.js:53-58` | Informatielek |
| SEC-015 | **Gemiddeld** | Container draait als root | `Dockerfile` | Docker |
| SEC-016 | **Gemiddeld** | Klant-PII opgeslagen zonder retentiebeleid of AVG-verwijdermechanisme | `server/db/database.js:44-56` | AVG/GDPR |
| SEC-017 | **Laag** | Winkelwagenprijzen in localStorage (server herberekent correct) | `client/src/context/CartContext.jsx:19` | Frontend |
| SEC-018 | **Laag** | Adminpagina publiek bereikbaar met zichtbare standaardcredentials | `client/src/App.jsx:23` | Frontend |
| SEC-019 | **Laag** | Bestellingenlijst zonder paginering — groeit onbeperkt | `server/routes/orders.js:63-66` | API / AVG |
| SEC-020 | **Laag** | Productafbeelding accepteert willekeurige URL's zonder domeinlijst | `server/routes/products.js:28` | Invoervalidatie |
| SEC-021 | **Info** | Dubbele id/slug-lookup gebruikt correct prepared statement | `server/routes/products.js:43` | Injectie |

---

## Gedetailleerde bevindingen

---

### SEC-001 · Kritiek · Authenticatie
**Token-vergelijking niet timing-safe**

**Locatie:** `server/utils/auth.js`, regel 22–25

**Beschrijving:**
De `requireAdmin`-middleware vergelijkt het Bearer-token met de verwachte HMAC-waarde via de JavaScript `!==`-operator. Dit is een string-vergelijking die stopt bij het eerste afwijkende karakter. Een aanvaller kan via nauwkeurige tijdmeting (timing oracle) over vele verzoeken de token teken voor teken reconstrueren, zonder het volledige 64-karakter hex-digest te hoeven brute-forcen.

**Impact:**
Een aanvaller met voldoende netwerkbandbreedte en meetnauwkeurigheid kan het admin-token herleiden zonder referenties te kennen. Na herstel heeft hij volledige admintoegang: alle klantbestellingen met PII inzien, producten aanpassen/verwijderen en bestellingen verwijderen.

**Bewijs:**
```javascript
// server/utils/auth.js regels 19-27
export function requireAdmin(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token !== createAdminToken()) {   // ← geen constant-time vergelijking
    next(httpError(401, "Niet ingelogd als admin."));
    return;
  }
  next();
}
```

**Herstel:**
```javascript
import crypto from "node:crypto";

export function requireAdmin(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const expected = createAdminToken();
  // Beide buffers moeten even lang zijn voor timingSafeEqual
  const tokBuf = Buffer.from(token.padEnd(expected.length, "\0"));
  const expBuf = Buffer.from(expected);
  if (tokBuf.length !== expBuf.length || !crypto.timingSafeEqual(tokBuf, expBuf)) {
    next(httpError(401, "Niet ingelogd als admin."));
    return;
  }
  next();
}
```
Pas dezelfde fix toe op de inlogvergelijking in `validateAdminCredentials`.

**Referenties:** CWE-208, OWASP Testing Guide – Timing Attacks

---

### SEC-002 · Kritiek · Authenticatie
**Deterministisch, herbruikbaar, nooit vervallend admin-token**

**Locatie:** `server/utils/auth.js`, regels 8–13; `client/src/pages/AdminPage.jsx`, regel 74

**Beschrijving:**
Het admin-token wordt berekend als `HMAC-SHA256(secret, "username:password")`. Dezelfde invoer levert altijd hetzelfde token op. Er is geen tijdstip-, nonce- of sessie-component. Het token vervalt nooit en kan niet worden geïnvalideerd zonder de omgevingsvariabelen te wijzigen én de server te herstarten. Het token wordt opgeslagen in `sessionStorage` van de browser.

**Impact:**
Wie het token eenmalig bemachtigt (via XSS, browsertool, netwerk-sniffing of loglek), heeft voor onbepaalde tijd admintoegang. Uitloggen verwijdert het token alleen uit de browser — een kopie bij de aanvaller blijft werken. Er is geen manier om een gecompromitteerde sessie te beëindigen.

**Bewijs:**
```javascript
// server/utils/auth.js regels 8-13
export function createAdminToken() {
  return crypto
    .createHmac("sha256", adminSecret)
    .update(`${adminUser}:${adminPassword}`)
    .digest("hex");  // volledig deterministisch, geen expiry
}
```
```javascript
// client/src/pages/AdminPage.jsx regel 74
sessionStorage.setItem("admin-token", result.token);
```

**Herstel:**
Genereer bij inloggen een cryptografisch willekeurig token (bijv. 32 bytes via `crypto.randomBytes`). Sla dit server-side op in een in-memory Map met een vervaltijd (bijv. 8 uur). Verwijder het bij uitloggen uit de Map, zodat uitloggen effectief is.

```javascript
// server/utils/auth.js (vereenvoudigd voorbeeld)
import crypto from "node:crypto";
const sessions = new Map(); // token → { user, expiresAt }

export function createSession(username) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { username, expiresAt: Date.now() + 8 * 3600 * 1000 });
  return token;
}

export function requireAdmin(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return next(httpError(401, "Niet ingelogd als admin."));
  }
  next();
}
```

**Referenties:** CWE-613 (Insufficient Session Expiration), CWE-330 (Insufficient Randomness), OWASP Session Management Cheat Sheet

---

### SEC-003 · Kritiek · Authenticatie / Secrets
**Hardgecodeerde standaardwachtwoorden + zichtbare hint op inlogpagina**

**Locatie:** `server/utils/auth.js` regels 4–6; `client/src/pages/AdminPage.jsx` regel 232; `server/openapi.js` regels 144–145

**Beschrijving:**
De server valt terug op `admin` / `admin123` / `local-admin-secret` als omgevingsvariabelen niet zijn ingesteld. De inlogpagina toont de standaardcredentials zichtbaar aan iedere bezoeker. De OpenAPI-spec documenteert dezelfde waarden als voorbeeldwaarden.

**Impact:**
In iedere misconfigureerde productie-installatie (ontbrekend `.env`-bestand) logt iedere bezoeker direct in als admin. Zelfs met correcte configuratie wijst de zichtbare hint bezoekers op het bestaan en locatie van de adminpagina.

**Bewijs:**
```javascript
// server/utils/auth.js regels 4-6
const adminUser     = process.env.ADMIN_USER     || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const adminSecret   = process.env.ADMIN_SECRET   || "local-admin-secret";
```
```jsx
// client/src/pages/AdminPage.jsx regel 232
<small>Standaard lokaal: admin / admin123</small>
```

**Herstel:**
1. Verwijder alle fallback-defaults. Start de server niet op als vereiste omgevingsvariabelen ontbreken:
```javascript
if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) {
  console.error("FATAL: ADMIN_USER, ADMIN_PASSWORD en ADMIN_SECRET zijn vereist.");
  process.exit(1);
}
```
2. Verwijder de `<small>`-hint uit `AdminPage.jsx`.
3. Verwijder de voorbeeldwaarden uit de OpenAPI-spec.

**Referenties:** CWE-798 (Use of Hard-coded Credentials), OWASP A07:2021 – Identification and Authentication Failures

---

### SEC-004 · Hoog · Authenticatie
**Geen rate limiting op het inlogendpunt**

**Locatie:** `server/routes/auth.js` regels 8–24; `server/index.js` (geen rate-limiting middleware aanwezig)

**Beschrijving:**
`POST /api/auth/login` heeft geen beperking op het aantal verzoeken per tijdseenheid. Er is geen `express-rate-limit`, geen account-lockout en geen CAPTCHA. Een aanvaller kan onbeperkt inlogpogingen doen.

**Impact:**
Met de standaardcredentials (`admin`/`admin123`) is de applicatie direct te compromitteren. Maar ook met aangepaste credentials is een online woordenlijstaanval volledig onbelemmerd uitvoerbaar.

**Bewijs:**
```javascript
// server/index.js regels 19-20 — geen rate-limiter
app.use(cors());
app.use(express.json({ limit: "1mb" }));
// Geen rate-limiting middleware geïnstalleerd
```

**Herstel:**
```bash
npm install express-rate-limit
```
```javascript
// server/routes/auth.js
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuten
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Te veel inlogpogingen. Probeer het later opnieuw." }
});

router.post("/login", loginLimiter, (req, res, next) => { /* ... */ });
```

**Referenties:** CWE-307 (Improper Restriction of Excessive Authentication Attempts), OWASP A07:2021

---

### SEC-005 · Hoog · API-beveiliging
**Wildcard CORS — alle origins toegestaan**

**Locatie:** `server/index.js`, regel 19

**Beschrijving:**
`app.use(cors())` zonder configuratie staat alle origins toe (`Access-Control-Allow-Origin: *`). Iedere website op het internet kan API-verzoeken versturen en antwoorden lezen. Een kwaadaardige site kan in de browser van een ingelogde beheerder (`sessionStorage`-token) aanroepen doen naar `/api/orders` en alle klant-PII ophalen.

**Bewijs:**
```javascript
// server/index.js regel 19
app.use(cors()); // Geen origin-beperking
```

**Herstel:**
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
```
Voeg `ALLOWED_ORIGIN=https://jouwdomein.nl` toe aan de productie-omgevingsvariabelen.

**Referenties:** CWE-346, OWASP A05:2021 – Security Misconfiguration

---

### SEC-006 · Hoog · HTTP-beveiligingsheaders
**Geen beveiligingsheaders — geen helmet, geen CSP, geen HSTS, geen X-Frame-Options**

**Locatie:** `server/index.js`, geheel bestand

**Beschrijving:**
De Express-applicatie gebruikt `helmet` noch enig equivalent. De volgende headers worden niet verzonden:

| Header | Risico bij afwezigheid |
|---|---|
| `Content-Security-Policy` | Geen XSS-barrière |
| `X-Frame-Options` / `frame-ancestors` | Clickjacking van adminpanel mogelijk |
| `X-Content-Type-Options: nosniff` | MIME-sniffing ingeschakeld |
| `Strict-Transport-Security` | Geen HTTPS-afdwinging |
| `Referrer-Policy` | Referer-lek mogelijk |

Bijzonder risicovol: de Swagger UI laadt JavaScript van `unpkg.com` (zie SEC-013); zonder CSP is er geen beperking op welke scripts mogen worden uitgevoerd.

**Herstel:**
```bash
npm install helmet
```
```javascript
// server/index.js
import helmet from "helmet";

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "https://unpkg.com"],
      styleSrc:   ["'self'", "https://unpkg.com", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https:"],
    }
  }
}));
```

**Referenties:** OWASP A05:2021, CWE-1021 (Clickjacking)

---

### SEC-007 · Hoog · Bedrijfslogica
**Race condition in voorraadvermindering — overselling mogelijk**

**Locatie:** `server/routes/orders.js` regels 82–131; `server/db/database.js` regels 18–26

**Beschrijving:**
Orderverwerking leest de voorraad, controleert of die toereikend is, en decrement vervolgens. De transactie start met `BEGIN` (deferred), wat in SQLite gelijktijdige lezers toestaat. Twee gelijktijdige POST-verzoeken kunnen allebei `stock = 1` lezen, allebei de check doorstaan en allebei een order aanmaken voor het laatste artikel.

**Bewijs:**
```javascript
// server/db/database.js regels 18-26
export function withTransaction(callback) {
  db.exec("BEGIN");  // ← deferred; geen schrijfslot bij aanvang
  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
```
```javascript
// server/routes/orders.js regels 84-88
const products = productIds.map((id) =>
  db.prepare("SELECT * FROM products WHERE id = ?").get(id)  // lees
);
products.forEach((product, index) => {
  if (product.stock < input.items[index].quantity) { /* check */ }
```

**Herstel:**
Gebruik `BEGIN IMMEDIATE` om direct een schrijfslot te verkrijgen bij de start van de transactie:
```javascript
export function withTransaction(callback) {
  db.exec("BEGIN IMMEDIATE");  // ← schrijfslot bij aanvang, elimineert race
  // ...
}
```
Voeg als extra laag een atomaire update toe:
```sql
UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?
```
Controleer daarna `changes === 1`; bij 0 is de voorraad inmiddels uitgeput.

**Referenties:** CWE-362 (Race Condition), OWASP Business Logic Testing

---

### SEC-008 · Hoog · Bedrijfslogica
**Geen idempotentie — dubbelklik of netwerkherpoging maakt dubbele bestelling**

**Locatie:** `server/routes/orders.js` regels 78–137; `client/src/pages/CheckoutPage.jsx` regels 41–59

**Beschrijving:**
`POST /api/orders` heeft geen duplicaat-detectie. Een dubbele klik, een time-out met herpoging of een browserbug kan twee identieke bestellingen aanmaken. De voorraad wordt tweemaal verlaagd; de klant ontvangt geen foutmelding.

**Bewijs:**
```jsx
// client/src/pages/CheckoutPage.jsx regels 41-59
async function submitOrder(event) {
  event.preventDefault();
  setSubmitting(true);
  try {
    const order = await api.createOrder({ /* geen idempotentie-sleutel */ });
    setSuccessOrder(order);
    clearCart();
  }
```

**Herstel:**
Genereer op de client een UUID wanneer het afrekenformulier wordt geladen. Stuur dit mee als `idempotencyKey`. Voeg een UNIQUE-constraint toe op de `orders`-tabel:
```sql
ALTER TABLE orders ADD COLUMN idempotency_key TEXT UNIQUE;
```
Geef bij een dubbele sleutel de bestaande bestelling terug (HTTP 200) in plaats van een fout.

**Referenties:** CWE-362, OWASP Business Logic Testing

---

### SEC-009 · Gemiddeld · Data / Injectie
**`SELECT *` in orderverwerking lekt alle productkolommen**

**Locatie:** `server/routes/orders.js`, regel 84

**Beschrijving:**
`SELECT * FROM products WHERE id = ?` haalt alle kolommen op, inclusief eventuele toekomstige gevoelige velden (inkoopprijs, interne notities). Overal elders in de code (`products.js`) wordt `productSelect` gebruikt met expliciete kolomselectie.

**Bewijs:**
```javascript
// server/routes/orders.js regel 84
db.prepare("SELECT * FROM products WHERE id = ?").get(id)
```

**Herstel:**
Vervang door expliciete kolomselectie:
```javascript
db.prepare("SELECT id, name, price, stock FROM products WHERE id = ?").get(id)
```

---

### SEC-010 · Gemiddeld · Invoervalidatie
**Geen maximale stringlengte — opslag-DoS via publiek bestelpunt**

**Locatie:** `server/utils/validation.js` regels 5–9; `server/index.js` regel 20

**Beschrijving:**
`requireString` controleert alleen een minimumlengte, niet een maximum. Anonieme bezoekers kunnen via `POST /api/orders` velden met willekeurige lengte insturen (tot 1 MB per verzoek). Herhaling vult de SQLite-database en schijf totdat de applicatie faalt.

**Bewijs:**
```javascript
// server/utils/validation.js regels 5-9
export function requireString(value, field, minLength = 1) {
  if (typeof value !== "string" || value.trim().length < minLength) {
    throw httpError(400, `${field} is verplicht.`);
  }
  return value.trim();
  // Geen maximumlengte
}
```

**Herstel:**
```javascript
export function requireString(value, field, minLength = 1, maxLength = 500) {
  const s = typeof value === "string" ? value.trim() : "";
  if (s.length < minLength) throw httpError(400, `${field} is verplicht.`);
  if (s.length > maxLength) throw httpError(400, `${field} mag maximaal ${maxLength} tekens bevatten.`);
  return s;
}
```
Stel voor `description` een hoger maximum in (bijv. 5000).

---

### SEC-011 · Gemiddeld · Invoervalidatie
**`requirePositiveNumber` staat prijs = 0 toe — gratis producten mogelijk**

**Locatie:** `server/utils/validation.js` regels 12–18

**Beschrijving:**
De validatiefunctie gebruikt `number < 0` als grenswaarde, waardoor 0 is toegestaan. Een beheerder (of een aanvaller die admintoegang heeft) kan een productprijs op 0 zetten, waarna klanten dat product gratis kunnen bestellen.

**Bewijs:**
```javascript
export function requirePositiveNumber(value, field) {
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) {  // ← 0 wordt doorgelaten
    throw httpError(400, `${field} moet een positief getal zijn.`);
  }
  return number;
}
```

**Herstel:**
Gebruik `number <= 0` voor het prijsveld, of maak een afzonderlijke `requirePrice`-functie.

---

### SEC-012 · Gemiddeld · Bedrijfslogica
**Onbeperkt aantal orderregels — event-loop DoS via publiek endpoint**

**Locatie:** `server/routes/orders.js` regels 44–60

**Beschrijving:**
`POST /api/orders` vereist alleen dat `items` een niet-lege array is. Er is geen bovengrens. Een verzoek met 10.000 items voert 10.000 afzonderlijke `SELECT`-queries uit in de synchrone Node.js event loop, waardoor alle andere verzoeken worden geblokkeerd zolang de verwerking duurt. Dit endpoint vereist geen authenticatie.

**Bewijs:**
```javascript
// server/routes/orders.js regels 44-60
function validateOrder(body) {
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw httpError(400, "De bestelling moet minimaal één product bevatten.");
  }
  // Geen maximum op body.items.length
  return { items: body.items.map(/* ... */) };
}
```

**Herstel:**
```javascript
if (body.items.length > 50) {
  throw httpError(400, "Een bestelling mag maximaal 50 producten bevatten.");
}
```

---

### SEC-013 · Gemiddeld · Supply chain / API
**Swagger UI geladen van externe CDN zonder SRI + `persistAuthorization: true`**

**Locatie:** `server/openapi.js` regels 323–329

**Beschrijving:**
De Swagger UI-pagina laadt JavaScript en CSS van `https://unpkg.com` zonder Subresource Integrity (SRI)-hashes. Als unpkg wordt gecompromitteerd of een BGP-kaping plaatsvindt, draait kwaadaardig JavaScript in de context van de Swagger-pagina. Bovendien is `persistAuthorization: true` ingesteld, waardoor ingevoerde admin-tokens worden bewaard in `localStorage`.

**Bewijs:**
```html
<!-- server/openapi.js regels 323-329 -->
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>
  SwaggerUIBundle({ persistAuthorization: true /* ← slaat tokens op */ })
</script>
```

**Herstel:**
1. Installeer `swagger-ui-dist` als lokale dependency en serveer de bestanden zelf.
2. Stel `persistAuthorization: false` in.
3. Overweeg `/api-docs` te blokkeren in productie (`NODE_ENV === "production"`).

---

### SEC-014 · Gemiddeld · Informatielek
**Foutafhandeling logt volledige stacktraces naar stdout**

**Locatie:** `server/index.js` regels 53–58

**Beschrijving:**
De globale errorhandler roept `console.error(err)` aan voor ieder foutobject, inclusief interne 500-fouten met bestandspaden en regelnummers. In een gecontaineriseerde omgeving gaat dit naar de Docker-log-driver. Als loggen breed toegankelijk is (cloud-logging, SaaS-platform), lekken implementatiedetails.

**Bewijs:**
```javascript
// server/index.js regels 53-58
app.use((err, _req, res, _next) => {
  console.error(err);  // ← volledige stack naar logs
  res.status(err.status || 500).json({ message: err.message });
});
```

**Herstel:**
```javascript
app.use((err, _req, res, _next) => {
  console.error(err); // logs blijven voor beheerder
  const status = err.status || 500;
  // Stuur nooit interne details naar de client bij 5xx
  const message = status < 500 ? err.message : "Er is een serverfout opgetreden.";
  res.status(status).json({ message });
});
```

---

### SEC-015 · Gemiddeld · Docker
**Container draait als root**

**Locatie:** `Dockerfile` (geen `USER`-directive aanwezig)

**Beschrijving:**
Het productie-Docker-image bevat geen `USER`-directive. De Node.js-applicatie draait als root (UID 0) in de container. Bij een toekomstige exploiteerbare kwetsbaarheid (bijv. in een dependency) krijgt de aanvaller root-toegang binnen de container, wat escalatie en laterale beweging vergemakkelijkt.

**Herstel:**
```dockerfile
FROM node:24-slim AS runtime
WORKDIR /app

# Maak niet-root gebruiker aan
RUN addgroup --system rembro && adduser --system --ingroup rembro rembro

COPY --from=build /app/server ./server
COPY --from=build /app/dist   ./dist
COPY --from=build /app/package.json ./

RUN chown -R rembro:rembro /app
USER rembro

CMD ["node", "server/index.js"]
```

**Referenties:** CWE-250 (Execution with Unnecessary Privileges), Docker Security Best Practices

---

### SEC-016 · Gemiddeld · AVG/GDPR
**Klant-PII opgeslagen zonder retentiebeleid, verwijdermechanisme of minimalisatie**

**Locatie:** `server/db/database.js` regels 44–56; `server/routes/orders.js`

**Beschrijving:**
De `orders`-tabel slaat op: `customer_name`, `email`, `phone`, `address`, `postal_code`, `city`. Dit zijn persoonsgegevens in de zin van de AVG. Er is geen:
- Automatische verwijdering na een gedefinieerde bewaartermijn
- Klant-toegankelijk verwijderverzoek (recht op vergetelheid, artikel 17 AVG)
- Anonimiseringsmechanisme
- Privacyverklaring in de applicatie

**Impact:**
Een Nederlandse webshop valt onder de AVG. Schending van bewaartermijnen en het ontbreken van een verwijdermechanisme kan leiden tot boetes tot 4% van de jaaromzet of € 20 miljoen (artikel 83 AVG).

**Herstel:**
1. Definieer een bewaartermijn (bijv. 7 jaar voor belastingdoeleinden, daarna anonimiseren).
2. Implementeer een anonimisatiefunctie:
```javascript
// Na retentieperiode: vervang PII door anonieme waarden
db.prepare(`UPDATE orders SET customer_name='Geanonimiseerd', email='', phone='', 
  address='', postal_code='', city='' WHERE created_at < ?`).run(cutoffDate);
```
3. Voeg een privacyverklaring toe aan de webshop.
4. Documenteer de verwerkingsgrondslag in een verwerkingsregister.

---

### SEC-017 · Laag · Frontend
**Winkelwagenprijzen opgeslagen in localStorage (weergave-effect, server herberekent)**

**Locatie:** `client/src/context/CartContext.jsx` regels 19–25

**Beschrijving:**
De winkelwagen wordt inclusief prijzen opgeslagen in `localStorage`. Een gebruiker of kwaadaardige browserextensie kan prijzen aanpassen in de lokale opslag. De weergegeven prijs in de winkelwagen klopt dan niet. De server herberekent het totaal echter altijd op basis van de database (`orders.js:93-95`), waardoor prijsmanipulatie geen invloed heeft op wat daadwerkelijk in de bestelling terechtkmt. Residueel risico: verwarring bij de gebruiker over het betaalde bedrag.

**Herstel:** Sla de prijs niet op in `localStorage`. Haal actuele prijzen op van de API bij het laden van de afreken-pagina, of valideer ze tegen de server voor weergave.

---

### SEC-018 · Laag · Frontend
**Adminpagina publiek bereikbaar met zichtbare standaardcredentials**

**Locatie:** `client/src/App.jsx` regel 23; `client/src/pages/AdminPage.jsx` regel 232

**Beschrijving:**
De route `/admin` is een publieke client-side React-route. Er is geen server-side beperking op het tonen van de adminpagina. De API-endpoints zijn correct beveiligd, maar de inlogpagina zelf is zichtbaar voor iedereen — inclusief de credential-hint (zie SEC-003).

**Herstel:** Verwijder de credential-hint (zie SEC-003). Overweeg een minder voorspelbaar adminpad (bijv. `/beheer`).

---

### SEC-019 · Laag · API / AVG
**Bestellingenlijst zonder paginering — groeit onbeperkt**

**Locatie:** `server/routes/orders.js` regels 63–66

**Beschrijving:**
`GET /api/orders` retourneert alle bestellingen in één antwoord zonder `LIMIT` of paginering. Bij groeiend ordervolume wordt dit een groot JSON-blok met veel klant-PII, wat zowel een performance- als een gegevensminimalisatieprobleem is.

**Bewijs:**
```javascript
router.get("/", requireAdmin, (_req, res) => {
  const orders = db.prepare(`${orderSelect} ORDER BY created_at DESC`).all(); // alles
  res.json(orders);
});
```

**Herstel:**
```javascript
router.get("/", requireAdmin, (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const offset = (page - 1) * limit;
  const orders = db.prepare(`${orderSelect} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(limit, offset);
  res.json(orders);
});
```

---

### SEC-020 · Laag · Invoervalidatie
**Productafbeelding accepteert willekeurige URL's**

**Locatie:** `server/routes/products.js` regel 28

**Beschrijving:**
Het `image`-veld accepteert iedere URL-string. Een beheerder (of aanvaller met gecompromitteerde adminaccount) kan tracking pixels, SSRF-aanvullende probes of ongepaste content instellen als afbeelding.

**Herstel:**
Valideer dat de URL overeenkomt met een allowlist van vertrouwde domeinen, of implementeer afbeeldingsuploads naar eigen opslag.

---

### SEC-021 · Info · Injectie
**Dubbele id/slug-lookup gebruikt correct prepared statement**

**Locatie:** `server/routes/products.js` regel 43

**Beschrijving:**
`WHERE id = ? OR slug = ?` met `req.params.id` voor beide parameters. SQLite voert type-coërcitie uit voor de `id`-vergelijking; bij een slug-string matcht `id` simpelweg niet. Er is geen SQL-injectierisico — flagged voor volledigheid.

---

## Prioriteitenkaart voor herstel

### Fase 1 — Onmiddellijk (kritiek / hoog, uitvoerbaar in uren)

| Prioriteit | Bevinding | Actie |
|---|---|---|
| 1 | SEC-003 | Verwijder hardgecodeerde defaults; server crasht als env-vars ontbreken |
| 2 | SEC-003 | Verwijder credential-hint uit AdminPage.jsx |
| 3 | SEC-004 | Installeer `express-rate-limit` op `/api/auth/login` |
| 4 | SEC-001 | Vervang `!==` door `crypto.timingSafeEqual` in `requireAdmin` |
| 5 | SEC-007 | Wijzig `BEGIN` naar `BEGIN IMMEDIATE` in `withTransaction` |
| 6 | SEC-012 | Voeg maximumlimiet toe op `body.items.length` in `validateOrder` |

### Fase 2 — Korte termijn (1–2 weken)

| Prioriteit | Bevinding | Actie |
|---|---|---|
| 7 | SEC-002 | Vervang deterministisch HMAC-token door willekeurige sessietoken met expiry |
| 8 | SEC-006 | Installeer `helmet` met CSP |
| 9 | SEC-005 | Beperk CORS tot eigen domein |
| 10 | SEC-008 | Implementeer idempotentie-sleutel voor orderplaatsing |
| 11 | SEC-013 | Bundel Swagger UI lokaal; zet `persistAuthorization: false` |
| 12 | SEC-010 | Voeg maximale stringlengte toe in `requireString` |

### Fase 3 — Structureel (maand)

| Prioriteit | Bevinding | Actie |
|---|---|---|
| 13 | SEC-015 | Voeg non-root gebruiker toe in Dockerfile |
| 14 | SEC-016 | Implementeer AVG-retentiebeleid en anonimisering |
| 15 | SEC-014 | Scheid loggen van foutrespons (geen 5xx-details naar client) |
| 16 | SEC-011 | Weiger prijs = 0 in validatie |
| 17 | SEC-019 | Voeg paginering toe aan bestellingenlijst |

---

## Positieve bevindingen

De volgende beveiligingspraktijken zijn correct geïmplementeerd:

1. **Server-side prijsherberekening** (`orders.js:93-95`): het ordertotaal wordt altijd herberekend vanuit de database. Prijsmanipulatie door de client heeft geen effect — dit is de meest kritische bedrijfslogica-beveiliging in een webshop en is correct gedaan.

2. **Geparameteriseerde queries door de gehele codebase**: alle SQL-queries gebruiken prepared statements met `?`-parameters. Er is geen string-concatenatie met gebruikersinvoer gevonden in SQL. SQL-injectie is niet aanwezig.

3. **Auth-middleware consistent toegepast op alle admin-routes**: iedere muterende en admin-lees-route past `requireAdmin` toe. `POST /api/orders` (publiek klantendpoint) heeft terecht geen auth-vereiste.

4. **Transactionele orderverwerking** (`orders.js:82`, `database.js:17-27`): orderaanmaak is omhult in een transactie, zodat order, orderregels en voorraadvermindering atomair worden verwerkt.

5. **Foreign keys ingeschakeld** (`database.js:15`): `PRAGMA foreign_keys = ON` waarborgt referentiële integriteit in SQLite.

6. **Geen `dangerouslySetInnerHTML` of `.innerHTML`**: in geen enkel React-component is een XSS-sink gevonden. Alle gebruikersdata wordt via React's DOM-abstractie gerenderd.

7. **Statuswaarden op allowlist gevalideerd** (`validation.js`): orderstatussen worden gevalideerd tegen een expliciete `allowedStatuses`-lijst; willekeurige statuswaarden worden geweigerd.

8. **`docker-compose.yml` vereist omgevingsvariabelen** (`docker-compose.yml:12-13`): `ADMIN_PASSWORD` en `ADMIN_SECRET` gebruiken de `${VAR:?melding}`-syntaxis, waardoor docker-compose weigert op te starten als deze variabelen ontbreken. Dit mitigeert SEC-003 gedeeltelijk voor gecontaineriseerde deployments.

9. **SQLite-bestand uitgesloten van deploypakket** (`deploy.yml:36-37`): de CI-workflow sluit `*.sqlite` expliciet uit, zodat productiedata niet per ongeluk wordt overschreven.

---

## Behoeft handmatige verificatie (niet vanuit code vast te stellen)

1. **TLS/HTTPS in productie**: `docker-compose.yml` exposeert poort 3001 zonder TLS. Of er een reverse proxy (nginx, Caddy, Traefik) voor staat die HTTPS afhandelt, is niet zichtbaar in de broncode. Zonder TLS worden het admin-token en klantgegevens onversleuteld verstuurd.

2. **SQLite-concurrency-modus met `node:sqlite`**: de `node:sqlite`-module is experimenteel in Node.js 24. Het standaard journal-modus en locking-gedrag (`PRAGMA journal_mode; PRAGMA locking_mode;`) beïnvloeden de ernst van SEC-007 en dienen te worden geverifieerd.

3. **Firewallconfiguratie**: of poort 3001 direct publiek toegankelijk is (versus achter een reverse proxy op `localhost`), moet op het productiesysteem worden gecontroleerd.

4. **Toegang tot Docker-logs**: of `console.error()`-output (met stacktraces) toegankelijk is voor ongeautoriseerde partijen in de cloud-hosting-omgeving dient te worden bevestigd.

5. **Docker volume-isolatie**: of het `rembro-data`-volume (SQLite-bestand) bereikbaar is vanuit andere containers of de Docker-host dient te worden geverifieerd.

6. **Betalingsprovider**: de huidige versie bevat geen betalingsintegratie. Als een betaalprovider (bijv. Mollie, Stripe) wordt toegevoegd, dient webhook-signatureverificatie te worden geïmplementeerd vóór de orderstatuswijziging naar "betaald".

---

*Dit rapport is gebaseerd op statische analyse van de broncode. Geen aanvallen zijn uitgevoerd op een live systeem. Alle bevindingen zijn verifieerbaar aan de hand van de geciteerde bestandspaden en regelnummers.*
