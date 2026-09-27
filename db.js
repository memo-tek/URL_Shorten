// db.js
// Connects to PostgreSQL using the 'pg' Pool, and ensures the urls table exists.

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || "myuser",
  password: process.env.PGPASSWORD || "mysecretpassword",
  database: process.env.PGDATABASE || "url_shortener",
});

async function connectDB(retries = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS urls (
          id SERIAL PRIMARY KEY,
          short_code VARCHAR(20) UNIQUE NOT NULL,
          original_url TEXT NOT NULL,
          clicks INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("Connected to PostgreSQL and ensured 'urls' table exists.");
      return;
    } catch (err) {
      console.error(`Attempt ${attempt}/${retries} - Failed to connect to PostgreSQL:`, err.message);
      if (attempt === retries) {
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = { pool, connectDB };