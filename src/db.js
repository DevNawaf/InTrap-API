const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL })
  : new Pool({
      host: process.env.POSTGRES_HOST || "db",
      port: Number(process.env.POSTGRES_PORT || 5432),
      user: process.env.POSTGRES_USER || "apiuser",
      password: process.env.POSTGRES_PASSWORD || "StrongApiPass2025",
      database: process.env.POSTGRES_DB || "intrap",
    });

module.exports = { pool };
