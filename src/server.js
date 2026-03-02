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

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
});

app.post("/api/v1/gallery-detections", createDetection);
app.get("/api/v1/gallery-detections", listDetections);
app.get("/api/v1/gallery-detections/:id", getDetection);
app.put("/api/v1/gallery-detections/:id", updateDetection);
app.delete("/api/v1/gallery-detections/:id", deleteDetection);

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
