const { pool } = require("./db");

function parseLimit(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function parseOffset(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

async function createDetection(req, res) {
  const {
    device_id,
    image_name,
    image_path,
    image_url,
    insect_name,
    life_stage,
    captured_at,
    received_at,
    confidence,
  } = req.body;

  if (!image_name || !image_path || !insect_name) {
    return res.status(400).json({
      error: "image_name, image_path, and insect_name are required",
    });
  }

  const query = `
    INSERT INTO gallery_detections
      (device_id, image_name, image_path, image_url, insect_name, life_stage, captured_at, received_at, confidence)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, now()), $9)
    RETURNING *
  `;

  const values = [
    device_id || null,
    image_name,
    image_path,
    image_url || null,
    insect_name,
    life_stage || null,
    captured_at || null,
    received_at || null,
    confidence ?? null,
  ];

  const result = await pool.query(query, values);
  return res.status(201).json(result.rows[0]);
}

async function listDetections(req, res) {
  const limit = parseLimit(req.query.limit, 100);
  const skip = parseOffset(req.query.skip, 0);

  const result = await pool.query(
    `SELECT * FROM gallery_detections ORDER BY received_at DESC LIMIT $1 OFFSET $2`,
    [limit, skip]
  );

  return res.json(result.rows);
}

async function getDetection(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const result = await pool.query(`SELECT * FROM gallery_detections WHERE id = $1`, [id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Record not found" });
  }

  return res.json(result.rows[0]);
}

async function updateDetection(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const allowedFields = [
    "device_id",
    "image_name",
    "image_path",
    "image_url",
    "insect_name",
    "life_stage",
    "captured_at",
    "received_at",
    "confidence",
  ];

  const entries = Object.entries(req.body).filter(([key]) => allowedFields.includes(key));
  if (entries.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  const setParts = entries.map(([key], idx) => `${key} = $${idx + 1}`);
  const values = entries.map(([, value]) => value);

  const query = `
    UPDATE gallery_detections
    SET ${setParts.join(", ")}
    WHERE id = $${values.length + 1}
    RETURNING *
  `;

  const result = await pool.query(query, [...values, id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Record not found" });
  }

  return res.json(result.rows[0]);
}

async function deleteDetection(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const result = await pool.query(`DELETE FROM gallery_detections WHERE id = $1`, [id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Record not found" });
  }

  return res.status(204).send();
}

module.exports = {
  createDetection,
  listDetections,
  getDetection,
  updateDetection,
  deleteDetection,
};
