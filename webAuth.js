"use strict";

const crypto = require("crypto");

function safeEqual(left, right) {
  const a = Buffer.from(String(left ?? ""));
  const b = Buffer.from(String(right ?? ""));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function createAuthMiddleware(token) {
  const expected = String(token ?? "");
  return function dashboardAuth(req, res, next) {
    const authorization = req.headers?.authorization || "";
    const provided = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (expected && safeEqual(provided, expected)) return next();

    res.status(401).json({ error: "Unauthorized" });
  };
}

module.exports = { safeEqual, createAuthMiddleware };
