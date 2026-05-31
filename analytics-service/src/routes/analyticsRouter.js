const router = require("express").Router();
const { getAnalytics, exportCSV, generatePDF } = require("../controllers/analyticsController");
const { protect } = require("../middleware/auth");

router.get("/analytics", protect, getAnalytics);
router.get("/export",    protect, exportCSV);
router.get("/report",    protect, generatePDF);

module.exports = router;
