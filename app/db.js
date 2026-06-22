"use strict";

const { Pool } = require("pg");
const log = require("./logger");

const pool = new Pool({
  host: process.env.DB_HOST || "postgres-service",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME || "productsdb",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
  statement_timeout: 5000,
});

pool.on("connect", () => log.info("DB pool: new client connected"));
pool.on("error", (err) =>
  log.error("DB pool: idle client error", { error: err.message })
);

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

module.exports = { pool, query };
