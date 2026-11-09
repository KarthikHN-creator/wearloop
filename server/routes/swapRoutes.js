const express = require("express");

const {
  createSwapRequest,
  getMySwapRequests,
  updateSwapStatus,
  submitSwapReview,
} = require("../controllers/swapController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createSwapRequest);

router.get("/", authMiddleware, getMySwapRequests);

router.patch("/:id/status", authMiddleware, updateSwapStatus);

router.post("/:id/reviews", authMiddleware, submitSwapReview);

module.exports = router;