const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveWebPort } = require("../serverConfig");

test("uses Pterodactyl SERVER_PORT when PORT is not set", () => {
  assert.equal(resolveWebPort({ SERVER_PORT: "4063" }), 4063);
});

test("prefers explicit PORT over SERVER_PORT", () => {
  assert.equal(resolveWebPort({ PORT: "8080", SERVER_PORT: "4063" }), 8080);
});

test("falls back to 5000 when no port is provided", () => {
  assert.equal(resolveWebPort({}), 5000);
});

test("rejects invalid ports", () => {
  assert.throws(() => resolveWebPort({ SERVER_PORT: "not-a-port" }), /valid port/i);
});
