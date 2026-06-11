import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeDatabase } from "./db/database.js";
import { openApiSpec, swaggerHtml } from "./openapi.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";

const app = express();
const port = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "..", "dist");

initializeDatabase();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api-docs/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

app.get("/api-docs", (_req, res) => {
  res.type("html").send(swaggerHtml());
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/api-docs")) {
      next();
      return;
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use((req, res) => {
  res.status(404).json({ message: `Route niet gevonden: ${req.method} ${req.path}` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Er is een serverfout opgetreden."
  });
});

app.listen(port, () => {
  console.log(`Rembro draait op http://localhost:${port}`);
});
