const router = require("express").Router();
const { getAnalytics, exportCSV, generatePDF, generateResearchPDF, generateCommunityPDF, getInsights, analyzeProject } = require("../controllers/analyticsController");
const { protect } = require("../middleware/auth");

router.get("/analytics", protect, getAnalytics);
router.get("/export",    protect, exportCSV);
router.get("/report",    protect, generatePDF);
router.get("/report/research", protect, generateResearchPDF);
router.get("/report/community", protect, generateCommunityPDF);

router.get("/ai/insights", protect, getInsights);
router.post("/ai/analyze-project", protect, analyzeProject);

module.exports = router;