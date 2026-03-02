const { pool } = require("./db");

const initQuery = `
CREATE TABLE IF NOT EXISTS gallery_detections (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT,
  image_name TEXT NOT NULL,
  image_path TEXT NOT NULL,
  image_url  TEXT,
  insect_name TEXT NOT NULL,
  life_stage  TEXT,
  captured_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confidence REAL
);

CREATE INDEX IF NOT EXISTS idx_gallery_detections_received_at
  ON gallery_detections (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_detections_insect_name
  ON gallery_detections (insect_name);
`;

async function initDb() {
  await pool.query(initQuery);
}

module.exports = { initDb };
