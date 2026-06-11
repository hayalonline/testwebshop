import { httpError } from "./httpError.js";

export const allowedStatuses = ["nieuw", "in_behandeling", "verzonden", "afgerond", "geannuleerd"];

export function requireString(value, field, minLength = 1) {
  if (typeof value !== "string" || value.trim().length < minLength) {
    throw httpError(400, `${field} is verplicht.`);
  }
  return value.trim();
}

export function requirePositiveNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw httpError(400, `${field} moet een positief getal zijn.`);
  }
  return number;
}

export function requirePositiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw httpError(400, `${field} moet een positief geheel getal zijn.`);
  }
  return number;
}

export function validateEmail(value) {
  const email = requireString(value, "E-mailadres");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError(400, "E-mailadres is ongeldig.");
  }
  return email;
}
