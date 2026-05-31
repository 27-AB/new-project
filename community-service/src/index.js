const app = require("./app");
const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`community-service running on http://localhost:${PORT}`);
  console.log("  POST /community-projects/seed  ← run once");
});
