"use strict";

const express = require("express");
const router = express.Router();
const { query } = require("../db");
const log = require("../logger");

// GET /products
router.get("/", async (req, res) => {
  try {
    const { sort = "id", order = "asc" } = req.query;
    const ALLOWED_SORT = [
      "id",
      "name",
      "price",
      "stock",
      "category",
      "created_at",
    ];
    const ALLOWED_ORDER = ["asc", "desc"];
    const safeSort = ALLOWED_SORT.includes(sort) ? sort : "id";
    const safeOrder = ALLOWED_ORDER.includes(order) ? order : "asc";

    const result = await query(
      `SELECT id, name, category, price, stock, description, created_at
       FROM products
       ORDER BY ${safeSort} ${safeOrder.toUpperCase()}`
    );

    log.info("Fetched all products", { count: result.rows.length });
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    log.error("Error fetching products", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch products" });
  }
});

// GET /products/search?q=
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: "Query param ?q= must be at least 2 characters",
    });
  }
  try {
    const result = await query(
      `SELECT id, name, category, price, stock, description
       FROM products
       WHERE name ILIKE $1 OR description ILIKE $1
       ORDER BY name`,
      [`%${q.trim()}%`]
    );
    log.info("Product search", { q, hits: result.rows.length });
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    log.error("Error searching products", { error: err.message });
    res.status(500).json({ success: false, error: "Search failed" });
  }
});

// GET /products/category/:category
router.get("/category/:category", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, category, price, stock, description
       FROM products
       WHERE category ILIKE $1
       ORDER BY name`,
      [req.params.category]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No products found in category '${req.params.category}'`,
      });
    }
    log.info("Fetched by category", {
      category: req.params.category,
      count: result.rows.length,
    });
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    log.error("Error fetching by category", { error: err.message });
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch products by category" });
  }
});

// GET /products/:id
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid product ID" });
  }
  try {
    const result = await query(
      "SELECT id, name, category, price, stock, description, created_at FROM products WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: `Product ${id} not found` });
    }
    log.info("Fetched product by id", { id });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    log.error("Error fetching product", { id, error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch product" });
  }
});

module.exports = router;
