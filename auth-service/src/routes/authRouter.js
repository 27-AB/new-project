const router = require("express").Router();
const { register, login, getMe, getUsers, updateRole, seed } = require("../controllers/authController");
const { protect, requireRole } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/users", protect, requireRole("admin"), getUsers);
router.put("/users/:id/role", protect, requireRole("admin"), updateRole);
router.post("/seed", seed);

module.exports = router;
