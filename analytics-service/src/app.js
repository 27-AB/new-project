require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors()); app.use(express.json());
app.get("/health", (_req, res) => res.json({ status: "ok", service: "analytics-service" }));
app.use("/api", require("./routes/analyticsRouter"));
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found." }));
module.exports = app;
