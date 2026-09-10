"use strict";

const fs = require("fs");
const path = require("path");

function resolvePort(env = process.env) {
  const raw = env.PORT ?? env.SERVER_PORT ?? "5000";
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be a valid port number (1-65535), got: ${raw}`);
  }
  return port;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeConfig(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override)) return override ?? base;

  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    result[key] = isPlainObject(value) && isPlainObject(result[key])
      ? mergeConfig(result[key], value)
      : value;
  }
  return result;
}

function loadConfig() {
  const basePath = path.join(__dirname, "settings.json");
  const localPath = path.join(__dirname, "settings.local.json");
  const base = JSON.parse(fs.readFileSync(basePath, "utf8"));

  if (!fs.existsSync(localPath)) return base;

  const local = JSON.parse(fs.readFileSync(localPath, "utf8"));
  return mergeConfig(base, local);
}

function start() {
  process.env.PORT = String(resolvePort(process.env));

  // index.js historically imports settings.json directly. Intercept only that
  // project-local file so secrets can live in settings.local.json without a
  // risky full rewrite of the legacy bot implementation.
  const Module = require("module");
  const originalLoad = Module._load;
  const settingsPath = require.resolve("./settings.json");
  const config = loadConfig();
  const { createAuthMiddleware } = require("./webAuth");
  const dashboardToken = process.env.DASHBOARD_TOKEN || "";

  Module._load = function(request, parent, isMain) {
    if (parent && request === "./settings.json" && parent.filename === path.join(__dirname, "index.js")) {
      return config;
    }

    if (request === "express") {
      const express = originalLoad.apply(this, arguments);
      const wrappedExpress = function(...args) {
        const app = express(...args);
        app.use(createAuthMiddleware(dashboardToken));
        return app;
      };
      Object.assign(wrappedExpress, express);
      return wrappedExpress;
    }

    return originalLoad.apply(this, arguments);
  };

  require("./index.js");
}

module.exports = { resolvePort, mergeConfig, loadConfig, start };

if (require.main === module) start();
