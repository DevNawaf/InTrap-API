const { pool } = require("./db");
const { createApiError } = require("./errors");

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;
const DEFAULT_SKIP = 0;
const SORT_BY_RECEIVED = "ORDER BY received_at DESC, id DESC";

const ALLOWED_FIELDS = new Set([
  "device_id",
  "image_name",
  "image_path",
  "image_url",
  "insect_name",
  "life_stage",
  "captured_at",
  "received_at",
  "confidence",
]);

const REQUIRED_FIELDS = new Set(["image_name", "image_path", "insect_name"]);

function ensureObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createApiError(400, "INVALID_REQUEST_BODY", `${field} must be an object`);
  }
}

function parseStrictPositiveInt(value, field) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createApiError(400, "INVALID_ID", `${field} must be a positive integer`);
  }
  return parsed;
}

function parseLimit(value) {
  if (value === undefined) {
    return DEFAULT_LIMIT;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createApiError(400, "INVALID_LIMIT", "limit must be a positive integer");
  }
  return Math.min(parsed, MAX_LIMIT);
}

function parseSkip(value) {
  if (value === undefined) {
    return DEFAULT_SKIP;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw createApiError(400, "INVALID_SKIP", "skip must be a non-negative integer");
  }
  return parsed;
}

function parseTimestamp(value, field, required) {
  if (value === undefined) {
    if (required) {
      throw createApiError(400, "VALIDATION_ERROR", `${field} is required`);
    }
    return undefined;
  }
  if (value === null) {
    if (required) {
      throw createApiError(400, "VALIDATION_ERROR", `${field} cannot be null`);
    }
    return null;
  }
  if (typeof value !== "string") {
    throw createApiError(400, "VALIDATION_ERROR", `${field} must be an ISO timestamp`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createApiError(400, "VALIDATION_ERROR", `${field} must be an ISO timestamp`);
  }
  return date.toISOString();
}

function parseText(value, field, required) {
  if (value === undefined) {
    if (required) {
      throw createApiError(400, "VALIDATION_ERROR", `${field} is required`);
    }
    return undefined;
  }
  if (value === null) {
    if (required) {
      throw createApiError(400, "VALIDATION_ERROR", `${field} cannot be null`);
    }
    return null;
  }
  if (typeof value !== "string") {
    throw createApiError(400, "VALIDATION_ERROR", `${field} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    if (required) {
      throw createApiError(400, "VALIDATION_ERROR", `${field} cannot be empty`);
    }
    return null;
  }
  return trimmed;
}

function parseConfidence(value, field) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw createApiError(400, "VALIDATION_ERROR", `${field} must be numeric`);
  }
  if (parsed < 0) {
    throw createApiError(400, "VALIDATION_ERROR", `${field} must be between 0 and 100`);
  }
  if (parsed <= 1) {
    return Math.max(0, Math.min(100, parsed * 100));
  }
  if (parsed > 100) {
    throw createApiError(400, "VALIDATION_ERROR", `${field} must be between 0 and 100`);
  }
  return parsed;
}

function normalizeConfidence(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  if (parsed <= 1) {
    return Math.max(0, Math.min(100, parsed * 100));
  }
  return Math.max(0, Math.min(100, parsed));
}

function toApiRow(row) {
  return {
    ...row,
    confidence: normalizeConfidence(row.confidence),
  };
}

function parseCursor(query) {
  const sinceReceivedAt = query.since_received_at;
  const sinceId = query.since_id;

  if (sinceReceivedAt === undefined && sinceId !== undefined) {
    throw createApiError(
      400,
      "INVALID_CURSOR",
      "since_received_at is required when since_id is provided"
    );
  }

  if (sinceReceivedAt === undefined) {
    return { sinceReceivedAt: null, sinceId: null };
  }

  const parsedDate = parseTimestamp(sinceReceivedAt, "since_received_at", true);
  const parsedSinceId =
    sinceId === undefined ? 0 : parseStrictPositiveInt(sinceId, "since_id");

  return { sinceReceivedAt: parsedDate, sinceId: parsedSinceId };
}

function parseDetectionField(key, value, { updateMode }) {
  if (key === "confidence") {
    return parseConfidence(value, key);
  }

  if (key === "captured_at" || key === "received_at") {
    return parseTimestamp(value, key, false);
  }

  if (REQUIRED_FIELDS.has(key)) {
    return parseText(value, key, true);
  }

  return parseText(value, key, false);
}

async function createDetection(req, res) {
  ensureObject(req.body, "body");

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

  const payload = {
    device_id: parseText(device_id, "device_id", false) ?? null,
    image_name: parseText(image_name, "image_name", true),
    image_path: parseText(image_path, "image_path", true),
    image_url: parseText(image_url, "image_url", false) ?? null,
    insect_name: parseText(insect_name, "insect_name", true),
    life_stage: parseText(life_stage, "life_stage", false) ?? null,
    captured_at: parseTimestamp(captured_at, "captured_at", false) ?? null,
    received_at: parseTimestamp(received_at, "received_at", false) ?? null,
    confidence: parseConfidence(confidence, "confidence"),
  };

  const query = `
    INSERT INTO gallery_detections
      (device_id, image_name, image_path, image_url, insect_name, life_stage, captured_at, received_at, confidence)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, now()), $9)
    RETURNING *
  `;

  const values = [
    payload.device_id,
    payload.image_name,
    payload.image_path,
    payload.image_url,
    payload.insect_name,
    payload.life_stage,
    payload.captured_at,
    payload.received_at,
    payload.confidence ?? null,
  ];

  const result = await pool.query(query, values);
  return res.status(201).json(toApiRow(result.rows[0]));
}

async function listDetections(req, res) {
  const limit = parseLimit(req.query.limit);
  const skip = parseSkip(req.query.skip);
  const cursor = parseCursor(req.query);

  let result;
  if (cursor.sinceReceivedAt !== null) {
    result = await pool.query(
      `
      SELECT * FROM gallery_detections
      WHERE (received_at > $3 OR (received_at = $3 AND id > $4))
      ${SORT_BY_RECEIVED}
      LIMIT $1 OFFSET $2
      `,
      [limit, skip, cursor.sinceReceivedAt, cursor.sinceId]
    );
  } else {
    result = await pool.query(
      `
      SELECT * FROM gallery_detections
      ${SORT_BY_RECEIVED}
      LIMIT $1 OFFSET $2
      `,
      [limit, skip]
    );
  }

  return res.json(result.rows.map(toApiRow));
}

async function getDetection(req, res) {
  const id = parseStrictPositiveInt(req.params.id, "id");

  const result = await pool.query(`SELECT * FROM gallery_detections WHERE id = $1`, [id]);
  if (result.rowCount === 0) {
    throw createApiError(404, "NOT_FOUND", "Record not found");
  }

  return res.json(toApiRow(result.rows[0]));
}

async function updateDetection(req, res) {
  const id = parseStrictPositiveInt(req.params.id, "id");
  ensureObject(req.body, "body");

  const keys = Object.keys(req.body);
  const invalidKeys = keys.filter((key) => !ALLOWED_FIELDS.has(key));
  if (invalidKeys.length > 0) {
    throw createApiError(400, "INVALID_FIELDS", "Unsupported fields in body", {
      invalidFields: invalidKeys,
    });
  }

  const entries = Object.entries(req.body);
  if (entries.length === 0) {
    throw createApiError(400, "NO_FIELDS_TO_UPDATE", "No valid fields to update");
  }

  const setParts = entries.map(([key], idx) => `${key} = $${idx + 1}`);
  const values = entries.map(([key, value]) =>
    parseDetectionField(key, value, { updateMode: true })
  );

  const query = `
    UPDATE gallery_detections
    SET ${setParts.join(", ")}
    WHERE id = $${values.length + 1}
    RETURNING *
  `;

  const result = await pool.query(query, [...values, id]);
  if (result.rowCount === 0) {
    throw createApiError(404, "NOT_FOUND", "Record not found");
  }

  return res.json(toApiRow(result.rows[0]));
}

async function deleteDetection(req, res) {
  const id = parseStrictPositiveInt(req.params.id, "id");

  const result = await pool.query(`DELETE FROM gallery_detections WHERE id = $1`, [id]);
  if (result.rowCount === 0) {
    throw createApiError(404, "NOT_FOUND", "Record not found");
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
