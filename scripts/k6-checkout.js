import http from "k6/http";
import { sleep, check, group } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

const checkoutDuration = new Trend("checkout_duration");
const checkoutErrors   = new Rate("checkout_errors");
const ordersCreated    = new Counter("orders_created");

export const options = {
  stages: [
    { duration: "30s", target: 5  }, // opwarmen
    { duration: "1m",  target: 20 }, // piekbelasting
    { duration: "30s", target: 0  }, // afkoelen
  ],
  thresholds: {
    "checkout_duration": ["p(95)<800", "p(99)<1500"],
    "checkout_errors":   ["rate<0.01"],
    "http_req_failed":   ["rate<0.01"],
  },
};

const BASE = "http://localhost:3001";

// Haal eerst de beschikbare product-IDs op
export function setup() {
  const res = http.get(`${BASE}/api/products`);
  const products = JSON.parse(res.body).filter(p => p.stock > 0);
  return { productIds: products.map(p => p.id) };
}

export default function (data) {
  const { productIds } = data;
  if (!productIds || productIds.length === 0) return;

  // Kies willekeurig 1–3 producten
  const count = Math.min(Math.floor(Math.random() * 3) + 1, productIds.length);
  const items = productIds.slice(0, count).map(id => ({
    productId: id,
    quantity: 1,
  }));

  const payload = JSON.stringify({
    customerName: `Test Klant ${__VU}`,
    email:        `test${__VU}@example.com`,
    phone:        "0612345678",
    address:      `Teststraat ${__ITER + 1}`,
    postalCode:   "1234AB",
    city:         "Amsterdam",
    items,
  });

  group("Checkout: Bestelling plaatsen", () => {
    const res = http.post(`${BASE}/api/orders`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { name: "POST /api/orders" },
    });

    checkoutDuration.add(res.timings.duration);

    const ok = check(res, {
      "status 201":         r => r.status === 201,
      "heeft order id":     r => JSON.parse(r.body).id > 0,
      "heeft orderItems":   r => JSON.parse(r.body).orderItems?.length === count,
      "total > 0":          r => JSON.parse(r.body).totalAmount > 0,
    });

    checkoutErrors.add(!ok);
    if (ok) ordersCreated.add(1);
  });

  sleep(3);
}
