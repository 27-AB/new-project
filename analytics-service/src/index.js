const app = require("./app");
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`analytics-service running on http://localhost:${PORT}`);
  console.log("  GET /api/analytics");
  console.log("  GET /api/export   ← downloads CSV");
  console.log("  GET /api/report   ← downloads PDF");
});
