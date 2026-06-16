import http from "k6/http";
import { sleep, check, group } from "k6";
import { Trend, Rate } from "k6/metrics";

const productDuration = new Trend("product_list_duration");
const detailDuration  = new Trend("product_detail_duration");
const errorRate       = new Rate("errors");

export const options = {
  stages: [
    { duration: "30s", target: 10  }, // opwarmen
    { duration: "1m",  target: 50  }, // piekbelasting
    { duration: "30s", target: 100 }, // stresstest
    { duration: "30s", target: 0   }, // afkoelen
  ],
  thresholds: {
    "http_req_duration":         ["p(95)<500"],  // p95 < 500ms
    "http_req_failed":           ["rate<0.01"],  // foutrate < 1%
    "product_list_duration":     ["p(95)<300"],
    "product_detail_duration":   ["p(95)<200"],
    "errors":                    ["rate<0.01"],
  },
};

const BASE = "http://localhost:3001";
const SLUGS = ["urban-rugzak", "minimal-desk-lamp", "linnen-weekendtas"];

export default function () {
  group("Browse: Home → productlijst", () => {
    const res = http.get(`${BASE}/api/products`, {
      tags: { name: "GET /api/products" },
    });
    productDuration.add(res.timings.duration);
    const ok = check(res, {
      "status 200":       r => r.status === 200,
      "heeft producten":  r => JSON.parse(r.body).length > 0,
      "Content-Type JSON":r => r.headers["Content-Type"].includes("application/json"),
    });
    errorRate.add(!ok);
    sleep(1);
  });

  group("Browse: Productdetailpagina", () => {
    const slug = SLUGS[Math.floor(Math.random() * SLUGS.length)];
    const res = http.get(`${BASE}/api/products/${slug}`, {
      tags: { name: "GET /api/products/:slug" },
    });
    detailDuration.add(res.timings.duration);
    const ok = check(res, {
      "status 200":     r => r.status === 200,
      "heeft slug":     r => JSON.parse(r.body).slug === slug,
      "heeft prijs":    r => JSON.parse(r.body).price > 0,
    });
    errorRate.add(!ok);
    sleep(2);
  });

  group("Browse: Niet-bestaand product (404)", () => {
    const res = http.get(`${BASE}/api/products/bestaat-niet`, {
      tags: { name: "GET /api/products/404" },
    });
    check(res, { "404 verwacht": r => r.status === 404 });
    sleep(0.5);
  });
}
