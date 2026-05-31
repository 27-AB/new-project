const router = require("express").Router();
const c = require("../controllers/communityController");
const { protect, requireRole } = require("../middleware/auth");

router.get("/",       protect, c.getAll);
router.get("/:id",    protect, c.getOne);
router.post("/",      protect, requireRole("admin", "researcher"), c.create);
router.put("/:id",    protect, requireRole("admin", "researcher"), c.update);
router.delete("/:id", protect, requireRole("admin"), c.remove);
router.post("/seed",  c.seed);

module.exports = router;
