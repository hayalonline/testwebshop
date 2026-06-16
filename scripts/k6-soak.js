/**
 * Soak test — langdurige belasting om memory leaks en connection exhaustion te detecteren.
 * Voer uit gedurende 30 minuten op een staging-omgeving.
 *
 * Run: k6 run scripts/k6-soak.js
 */
import http from "k6/http";
import { sleep, check } from "k6";
import { Trend, Rate } from "k6/metrics";

const soakDuration = new Trend("soak_req_duration");
const errorRate    = new Rate("soak_errors");

export const options = {
  stages: [
    { duration: "2m",  target: 20 }, // opwarmen
    { duration: "25m", target: 20 }, // sustained load (memory leak detectie)
    { duration: "3m",  target: 0  }, // afkoelen
  ],
  thresholds: {
    "soak_req_duration": ["p(95)<600"],  // latentie mag niet stijgen bij sustained load
    "soak_errors":       ["rate<0.01"],
    "http_req_failed":   ["rate<0.01"],
  },
};

const BASE = "http://localhost:3001";
const ENDPOINTS = [
  `${BASE}/api/products`,
  `${BASE}/api/products/urban-rugzak`,
  `${BASE}/api/products/minimal-desk-lamp`,
  `${BASE}/api/health`,
];

export default function () {
  const url = ENDPOINTS[__ITER % ENDPOINTS.length];
  const res = http.get(url);
  soakDuration.add(res.timings.duration);
  const ok = check(res, { "status 200": r => r.status === 200 });
  errorRate.add(!ok);
  sleep(1.5);
}
