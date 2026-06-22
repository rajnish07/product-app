"use strict";

const express = require("express");
const os = require("os");
const log = require("./logger");
const requestLogger = require("./middleware/requestLogger");
const productsRouter = require("./routes/products");
const { pool, query } = require("./db");

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());
app.use(requestLogger);

// root / info
app.get("/", (_req, res) => {
  res.json({
    service: "Product API",
    version: process.env.API_VERSION || "1.0.0",
    hostname: os.hostname(),
    uptime_s: Math.floor(process.uptime()),
    endpoints: [
      "GET  /",
      "GET  /health",
      "GET  /ready",
      "GET  /products",
      "GET  /products/:id",
      "GET  /products/category/:category",
      "GET  /products/search?q=",
    ],
  });
});

// liveness
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", hostname: os.hostname() });
});

// readiness
app.get("/ready", async (_req, res) => {
  try {
    await query("SELECT 1");
    res
      .status(200)
      .json({ status: "ready", db: "connected", hostname: os.hostname() });
  } catch (err) {
    log.error("Readiness check failed", { error: err.message });
    res.status(503).json({ status: "not_ready", db: err.message });
  }
});

// mount product routes under /products
app.use("/products", productsRouter);

// global error handler
app.use((err, _req, res, _next) => {
  log.error("Unhandled error", { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: "Internal server error" });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

const server = app.listen(PORT, () => {
  log.info("Product API started", {
    port: PORT,
    hostname: os.hostname(),
    db_host: process.env.DB_HOST || "postgres-service",
    db_name: process.env.DB_NAME || "productsdb",
    version: process.env.API_VERSION || "1.0.0",
  });
});

async function shutdown(signal) {
  log.warn(`${signal} received — starting graceful shutdown`);
  server.close(async () => {
    log.info("HTTP server closed — draining DB pool");
    await pool.end();
    log.info("DB pool closed — exiting");
    process.exit(0);
  });

  setTimeout(() => {
    log.error("Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, 15000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
