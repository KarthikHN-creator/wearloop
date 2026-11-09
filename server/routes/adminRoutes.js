const express = require("express");

const {
  getAdminStats,
  getAllUsers,
  getAllClothing,
  getAllSwaps,
  deleteClothingByAdmin,
  updateUserRole,
  deleteUser
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// All routes require logged-in admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard statistics
router.get("/stats", getAdminStats);

// Users
router.get("/users", getAllUsers);

// Clothing listings
router.get("/clothing", getAllClothing);

// Swap requests
router.get("/swaps", getAllSwaps);

// Delete inappropriate listing
router.delete("/clothing/:id", deleteClothingByAdmin);

router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

module.exports = router;