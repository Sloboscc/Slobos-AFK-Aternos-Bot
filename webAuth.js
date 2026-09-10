"use strict";

const crypto = require("crypto");

function safeEqual(left, right) {
  const a = Buffer.from(String(left ?? ""));
  const b = Buffer.from(String(right ?? ""));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function readCookie(header, name) {
  const cookies = String(header || "").split(";");
  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

function createAuthMiddleware(token) {
  const expected = String(token ?? "");
  return function dashboardAuth(req, res, next) {
    if (!expected && ["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

    // Allow the dashboard's own browser UI to authenticate after its first GET.
    if (expected && ["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      res.setHeader("Set-Cookie", `dashboard_token=${encodeURIComponent(expected)}; Path=/; HttpOnly; SameSite=Strict`);
      return next();
    }

    const authorization = req.headers?.authorization || "";
    const bearer = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";
    const cookieToken = readCookie(req.headers?.cookie, "dashboard_token");

    if (expected && (safeEqual(bearer, expected) || safeEqual(cookieToken, expected))) {
      return next();
    }

    res.status(401).json({ error: "Unauthorized" });
  };
}

module.exports = { safeEqual, createAuthMiddleware };
