// server.js
// Simple URL Shortener — CodeAlpha Backend Development Internship (Task 1)
// Now using PostgreSQL (via 'pg') for storage.
//
// Endpoints:
//   POST /api/shorten   -> accepts { url } and returns a short code
//   GET  /:code          -> redirects to the original long URL
//   GET  /api/urls        -> (bonus) lists all shortened URLs with click counts
//
// Setup:
//   1. Make sure PostgreSQL is running (locally or via Docker).
//   2. npm install
//   3. npm start

require("dotenv").config();
const express = require("express");
const path = require("path");
const { nanoid } = require("nanoid");
const { pool, connectDB } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serves the optional frontend

// --- Helpers -----------------------------------------------------------

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (err) {
    return false;
  }
}

// --- Routes --------------------------------------------------------------

// Create a short URL
app.post("/api/shorten", async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Please provide a 'url' field in the request body." });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "The provided URL is not valid. Include http:// or https://" });
  }

  try {
    const existingResult = await pool.query(
      "SELECT * FROM urls WHERE original_url = $1 LIMIT 1",
      [url]
    );
    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      return res.status(200).json({
        shortCode: existing.short_code,
        shortUrl: `${BASE_URL}/${existing.short_code}`,
        originalUrl: existing.original_url,
      });
    }

    let shortCode;
    let clash = true;
    while (clash) {
      shortCode = nanoid(7);
      const clashResult = await pool.query(
        "SELECT id FROM urls WHERE short_code = $1",
        [shortCode]
      );
      clash = clashResult.rows.length > 0;
    }

    const insertResult = await pool.query(
      "INSERT INTO urls (short_code, original_url) VALUES ($1, $2) RETURNING *",
      [shortCode, url]
    );
    const newUrl = insertResult.rows[0];

    return res.status(201).json({
      shortCode: newUrl.short_code,
      shortUrl: `${BASE_URL}/${newUrl.short_code}`,
      originalUrl: newUrl.original_url,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong while shortening the URL." });
  }
});

// Redirect short code -> original URL
app.get("/:code", async (req, res, next) => {
  const { code } = req.params;

  if (code === "favicon.ico") return next();

  try {
    const result = await pool.query(
      "UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1 RETURNING *",
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Short URL not found." });
    }

    return res.redirect(result.rows[0].original_url);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

// Bonus: list all shortened URLs (useful for the frontend / testing)
app.get("/api/urls", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM urls ORDER BY created_at DESC");
    res.json(
      result.rows.map((u) => ({
        shortCode: u.short_code,
        shortUrl: `${BASE_URL}/${u.short_code}`,
        originalUrl: u.original_url,
        clicks: u.clicks,
        createdAt: u.created_at,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch URLs." });
  }
});

// --- Start server after DB connects --------------------------------------

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`URL Shortener running at ${BASE_URL}`);
  });
});
