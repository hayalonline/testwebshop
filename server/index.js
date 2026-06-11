import express from "express";
import cors from "cors";
import { initializeDatabase } from "./db/database.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";

const app = express();
const port = process.env.PORT || 3001;

initializeDatabase();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

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
  console.log(`Webshop API draait op http://localhost:${port}`);
});
