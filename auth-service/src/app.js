require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Auth-service connected to MongoDB"))
  .catch(err => console.error("MongoDB error:", err.message));

app.use((req, _res, next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`); next(); });
app.get("/health", (_req, res) => res.json({ status: "ok", service: "auth-service" }));
app.use("/auth", require("./routes/authRouter"));
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found." }));

module.exports = app;
