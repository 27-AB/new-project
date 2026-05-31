require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
app.use(cors()); app.use(express.json());
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Community-service connected to MongoDB"))
  .catch(err => console.error("MongoDB error:", err.message));
app.get("/health", (_req, res) => res.json({ status: "ok", service: "community-service" }));
app.use("/community-projects", require("./routes/communityRouter"));
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found." }));
module.exports = app;
