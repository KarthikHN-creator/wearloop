
const express = require("express");

const {
  getProfile,
  getPublicProfile,
  updateProfile,
  uploadProfileImage,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// =========================================
// PUBLIC MEMBER PROFILE
// GET /api/users/:userId/public
// =========================================
router.get("/:userId/public", getPublicProfile);

// =========================================
// GET LOGGED-IN USER PROFILE
// GET /api/users/profile
// =========================================
router.get(
  "/profile",
  authMiddleware,
  getProfile
);

// =========================================
// UPDATE USER PROFILE
// PATCH /api/users/profile
// =========================================
router.patch(
  "/profile",
  authMiddleware,
  updateProfile
);

// =========================================
// UPLOAD PROFILE IMAGE
// POST /api/users/profile/image
// =========================================
router.post(
  "/profile/image",
  authMiddleware,
  upload.single("profileImage"),
  uploadProfileImage
);

module.exports = router;
