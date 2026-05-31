const router = require("express").Router();
const c = require("../controllers/collegeController");
const { protect } = require("../middleware/auth");

router.get("/colleges",     protect, c.getColleges);
router.get("/researchers",  protect, c.getResearchers);
router.post("/seed",        c.seed);

module.exports = router;
