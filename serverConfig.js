function resolveWebPort(env = process.env) {
  const raw = env.PORT ?? env.SERVER_PORT ?? "5000";
  const port = Number(raw);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `PORT must be a valid port number (1-65535), got: ${raw}`,
    );
  }

  return port;
}

module.exports = { resolveWebPort };
