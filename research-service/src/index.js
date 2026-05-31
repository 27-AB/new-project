const app = require("./app");
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`research-service running on http://localhost:${PORT}`);
  console.log("  POST /projects/seed  ← run once to populate database");
});
