import { Router } from "express";
import { db, withTransaction } from "../db/database.js";
import { requireAdmin } from "../utils/auth.js";
import { httpError } from "../utils/httpError.js";
import { allowedStatuses, requirePositiveInteger, requireString, validateEmail } from "../utils/validation.js";

const router = Router();

const orderSelect = `
  SELECT
    id,
    customer_name as customerName,
    email,
    phone,
    address,
    postal_code as postalCode,
    city,
    total_amount as totalAmount,
    order_status as orderStatus,
    created_at as createdAt,
    updated_at as updatedAt
  FROM orders
`;

const itemSelect = `
  SELECT
    id,
    order_id as orderId,
    product_id as productId,
    product_name as productName,
    quantity,
    unit_price as unitPrice,
    total_price as totalPrice
  FROM order_items
`;

function getOrderWithItems(id) {
  const order = db.prepare(`${orderSelect} WHERE id = ?`).get(id);
  if (!order) return null;
  order.items = db.prepare(`${itemSelect} WHERE order_id = ? ORDER BY id`).all(id);
  return order;
}

function validateOrder(body) {
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw httpError(400, "De bestelling moet minimaal één product bevatten.");
  }

  return {
    customerName: requireString(body.customerName, "Naam"),
    email: validateEmail(body.email),
    phone: requireString(body.phone, "Telefoonnummer"),
    address: requireString(body.address, "Adres"),
    postalCode: requireString(body.postalCode, "Postcode"),
    city: requireString(body.city, "Plaats"),
    items: body.items.map((item) => ({
      productId: requirePositiveInteger(item.productId, "Product"),
      quantity: Math.max(1, requirePositiveInteger(item.quantity, "Aantal"))
    }))
  };
}

router.get("/", requireAdmin, (_req, res) => {
  const orders = db.prepare(`${orderSelect} ORDER BY created_at DESC`).all();
  res.json(orders);
});

router.get("/:id", requireAdmin, (req, res, next) => {
  try {
    const order = getOrderWithItems(req.params.id);
    if (!order) throw httpError(404, "Order niet gevonden.");
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.post("/", (req, res, next) => {
  try {
    const input = validateOrder(req.body);

    const createOrder = () => withTransaction(() => {
      const productIds = input.items.map((item) => item.productId);
      const products = productIds.map((id) => db.prepare("SELECT * FROM products WHERE id = ?").get(id));

      products.forEach((product, index) => {
        if (!product) throw httpError(400, `Product ${productIds[index]} bestaat niet.`);
        if (product.stock < input.items[index].quantity) {
          throw httpError(400, `Onvoldoende voorraad voor ${product.name}.`);
        }
      });

      const totalAmount = input.items.reduce((sum, item, index) => {
        return sum + products[index].price * item.quantity;
      }, 0);

      const orderResult = db.prepare(`
        INSERT INTO orders (customer_name, email, phone, address, postal_code, city, total_amount)
        VALUES (@customerName, @email, @phone, @address, @postalCode, @city, @totalAmount)
      `).run({
        customerName: input.customerName,
        email: input.email,
        phone: input.phone,
        address: input.address,
        postalCode: input.postalCode,
        city: input.city,
        totalAmount
      });

      const orderId = orderResult.lastInsertRowid;
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
        VALUES (@orderId, @productId, @productName, @quantity, @unitPrice, @totalPrice)
      `);
      const updateStock = db.prepare("UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");

      input.items.forEach((item, index) => {
        const product = products[index];
        insertItem.run({
          orderId,
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: product.price * item.quantity
        });
        updateStock.run(item.quantity, product.id);
      });

      return getOrderWithItems(orderId);
    });

    res.status(201).json(createOrder());
  } catch (error) {
    next(error);
  }
});

router.put("/:id/status", requireAdmin, (req, res, next) => {
  try {
    const status = requireString(req.body.status, "Status");
    if (!allowedStatuses.includes(status)) {
      throw httpError(400, `Status moet één van deze waarden zijn: ${allowedStatuses.join(", ")}.`);
    }

    const result = db.prepare(`
      UPDATE orders
      SET order_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, req.params.id);

    if (result.changes === 0) throw httpError(404, "Order niet gevonden.");
    res.json(getOrderWithItems(req.params.id));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAdmin, (req, res, next) => {
  try {
    const result = db.prepare("DELETE FROM orders WHERE id = ?").run(req.params.id);
    if (result.changes === 0) throw httpError(404, "Order niet gevonden.");
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
