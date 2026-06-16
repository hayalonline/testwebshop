/**
 * Spike test — simuleert een plotselinge piek (bijv. een uitverkoop of viral post).
 * Doel: vaststellen bij welke load SQLite's single-writer lock de bottleneck wordt.
 *
 * Run: k6 run scripts/k6-spike.js
 */
import http from "k6/http";
import { sleep, check } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("spike_errors");

export const options = {
  stages: [
    { duration: "10s", target: 5   }, // baseline
    { duration: "5s",  target: 200 }, // directe piek naar 200 VUs
    { duration: "1m",  target: 200 }, // piek sustained (SQLite write contention)
    { duration: "10s", target: 5   }, // terugval
    { duration: "10s", target: 0   }, // stop
  ],
  thresholds: {
    "http_req_failed":   ["rate<0.05"], // max 5% fouten bij spike
    "http_req_duration": ["p(99)<2000"],
    "spike_errors":      ["rate<0.05"],
  },
};

const BASE = "http://localhost:3001";

export default function () {
  // Mix van browse (80%) en checkout (20%) om realistisch te zijn
  if (Math.random() < 0.8) {
    // Browse
    const res = http.get(`${BASE}/api/products`);
    const ok = check(res, { "browse 200": r => r.status === 200 });
    errorRate.add(!ok);
    sleep(0.5);
  } else {
    // Checkout
    const payload = JSON.stringify({
      customerName: `Spike Klant ${__VU}`,
      email: `spike${__VU}@example.com`,
      phone: "0600000000",
      address: "Pieklaan 1",
      postalCode: "9999ZZ",
      city: "Utrecht",
      items: [{ productId: 1, quantity: 1 }],
    });
    const res = http.post(`${BASE}/api/orders`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    const ok = check(res, {
      "checkout 201 of 400": r => r.status === 201 || r.status === 400,
    });
    errorRate.add(!ok);
    sleep(1);
  }
}
