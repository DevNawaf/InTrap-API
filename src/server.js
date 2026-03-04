require("dotenv").config();

const crypto = require("crypto");
const cors = require("cors");
const express = require("express");

const { pool } = require("./db");
const { createApiError } = require("./errors");
const { initDb } = require("./init-db");
const {
  createDetection,
  listDetections,
  getDetection,
  updateDetection,
  deleteDetection,
} = require("./handlers");

const app = express();
const port = Number(process.env.PORT || 8000);
const apiPrefix = "/api/v1";

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

app.use((req, res, next) => {
  const requestId = req.get("x-request-id") || crypto.randomUUID();
  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", asyncHandler(async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
}));

app.get(`${apiPrefix}/health`, asyncHandler(async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
}));

app.post(`${apiPrefix}/gallery-detections`, asyncHandler(createDetection));
app.get(`${apiPrefix}/gallery-detections`, asyncHandler(listDetections));
app.get(`${apiPrefix}/gallery-detections/:id`, asyncHandler(getDetection));
app.put(`${apiPrefix}/gallery-detections/:id`, asyncHandler(updateDetection));
app.delete(`${apiPrefix}/gallery-detections/:id`, asyncHandler(deleteDetection));

app.use((req, res) => {
  const payload = {
    code: "NOT_FOUND",
    message: "Route not found",
    details: {
      path: req.originalUrl,
      method: req.method,
    },
    requestId: res.locals.requestId || null,
  };
  res.status(404).json(payload);
});

app.use((err, req, res, next) => {
  const status =
    Number.isInteger(err.status) && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  const code = typeof err.code === "string" ? err.code : "INTERNAL_ERROR";
  const message =
    status >= 500
      ? "Internal server error"
      : typeof err.message === "string" && err.message
      ? err.message
      : "Request failed";

  const payload = {
    code,
    message,
    requestId: res.locals.requestId || null,
  };

  if (err.details !== undefined) {
    payload.details = err.details;
  }

  console.error(
    JSON.stringify({
      level: "error",
      requestId: res.locals.requestId || null,
      method: req.method,
      path: req.originalUrl,
      status,
      code,
      error: err.message,
      details: err.details,
    })
  );

  res.status(status).json(payload);
});

async function start() {
  await initDb();
  app.listen(port, "0.0.0.0", () => {
    console.log(`InTrap API listening on port ${port}`);
  });
}

start().catch((err) => {
  const startupError = createApiError(
    500,
    "STARTUP_FAILED",
    "Failed to start server"
  );
  startupError.details = { error: err.message };
  console.error(startupError);
  process.exit(1);
});
