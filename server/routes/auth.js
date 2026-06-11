import { Router } from "express";
import { createAdminToken, validateAdminCredentials } from "../utils/auth.js";
import { httpError } from "../utils/httpError.js";
import { requireString } from "../utils/validation.js";

const router = Router();

router.post("/login", (req, res, next) => {
  try {
    const username = requireString(req.body.username, "Gebruikersnaam");
    const password = requireString(req.body.password, "Wachtwoord");

    if (!validateAdminCredentials(username, password)) {
      throw httpError(401, "Gebruikersnaam of wachtwoord is onjuist.");
    }

    res.json({
      token: createAdminToken(),
      user: { username }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
