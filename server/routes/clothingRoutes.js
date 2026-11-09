const express = require("express");

const {
  addClothing,
  getClothes,
  getClothingById,
  deleteClothing,
  updateClothing,
  getRecommendedClothing,
} = require("../controllers/clothingController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/recommendations",
  authMiddleware,
  getRecommendedClothing
);

// Public routes
router.get("/", getClothes);
router.get("/:id", getClothingById);

// Protected routes
router.post("/", authMiddleware, addClothing);
router.delete("/:id", authMiddleware, deleteClothing);
router.patch("/:id", authMiddleware, updateClothing);

module.exports = router;