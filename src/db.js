const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL })
  : new Pool({
      host: process.env.POSTGRES_HOST || process.env.DB_HOST || "root-postgres-1",
      port: Number(process.env.POSTGRES_PORT || process.env.DB_PORT || 5432),
      user: process.env.POSTGRES_USER || process.env.DB_USER || "apiuser",
      password: process.env.POSTGRES_PASSWORD || process.env.DB_PASS || "StrongApiPass2025",
      database: process.env.POSTGRES_DB || process.env.DB_NAME || "intrap",
    });

module.exports = { pool };
