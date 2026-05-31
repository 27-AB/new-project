const app = require("./app");
const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
  console.log(`college-service running on http://localhost:${PORT}`);
  console.log("  POST /seed  ← run once to populate colleges & researchers");
});
