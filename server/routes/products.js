import { Router } from "express";
import { db } from "../db/database.js";
import { httpError } from "../utils/httpError.js";
import { requirePositiveInteger, requirePositiveNumber, requireString } from "../utils/validation.js";

const router = Router();

const productSelect = `
  SELECT
    id,
    name,
    slug,
    description,
    price,
    image,
    stock,
    category,
    created_at as createdAt,
    updated_at as updatedAt
  FROM products
`;

function mapProductInput(body) {
  return {
    name: requireString(body.name, "Naam"),
    slug: requireString(body.slug, "Slug").toLowerCase(),
    description: requireString(body.description, "Beschrijving"),
    price: requirePositiveNumber(body.price, "Prijs"),
    image: requireString(body.image, "Afbeelding"),
    stock: requirePositiveInteger(body.stock, "Voorraad"),
    category: requireString(body.category, "Categorie")
  };
}

router.get("/", (_req, res) => {
  const products = db.prepare(`${productSelect} ORDER BY created_at DESC`).all();
  res.json(products);
});

router.get("/:id", (req, res, next) => {
  try {
    const product = db.prepare(`${productSelect} WHERE id = ? OR slug = ?`).get(req.params.id, req.params.id);
    if (!product) throw httpError(404, "Product niet gevonden.");
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.post("/", (req, res, next) => {
  try {
    const product = mapProductInput(req.body);
    const result = db.prepare(`
      INSERT INTO products (name, slug, description, price, image, stock, category)
      VALUES (@name, @slug, @description, @price, @image, @stock, @category)
    `).run(product);

    const created = db.prepare(`${productSelect} WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      next(httpError(409, "Er bestaat al een product met deze slug."));
      return;
    }
    next(error);
  }
});

router.put("/:id", (req, res, next) => {
  try {
    const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
    if (!existing) throw httpError(404, "Product niet gevonden.");

    const product = mapProductInput(req.body);
    db.prepare(`
      UPDATE products
      SET name = @name,
          slug = @slug,
          description = @description,
          price = @price,
          image = @image,
          stock = @stock,
          category = @category,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run({ ...product, id: req.params.id });

    const updated = db.prepare(`${productSelect} WHERE id = ?`).get(req.params.id);
    res.json(updated);
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      next(httpError(409, "Er bestaat al een product met deze slug."));
      return;
    }
    next(error);
  }
});

router.delete("/:id", (req, res, next) => {
  try {
    const result = db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    if (result.changes === 0) throw httpError(404, "Product niet gevonden.");
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
