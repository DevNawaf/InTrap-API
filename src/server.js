require("dotenv").config();

const cors = require("cors");
const express = require("express");

const { pool } = require("./db");
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
const apiPrefix = "/intrap/api/v1";

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
});

app.post(`${apiPrefix}/gallery-detections`, createDetection);
app.get(`${apiPrefix}/gallery-detections`, listDetections);
app.get(`${apiPrefix}/gallery-detections/:id`, getDetection);
app.put(`${apiPrefix}/gallery-detections/:id`, updateDetection);
app.delete(`${apiPrefix}/gallery-detections/:id`, deleteDetection);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  await initDb();
  app.listen(port, "0.0.0.0", () => {
    console.log(`InTrap API listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
