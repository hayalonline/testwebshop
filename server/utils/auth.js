import crypto from "node:crypto";
import { httpError } from "./httpError.js";

const adminUser = process.env.ADMIN_USER || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const adminSecret = process.env.ADMIN_SECRET || "local-admin-secret";

export function createAdminToken() {
  return crypto
    .createHmac("sha256", adminSecret)
    .update(`${adminUser}:${adminPassword}`)
    .digest("hex");
}

export function validateAdminCredentials(username, password) {
  return username === adminUser && password === adminPassword;
}

export function requireAdmin(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token !== createAdminToken()) {
    next(httpError(401, "Niet ingelogd als admin."));
    return;
  }
  next();
}
