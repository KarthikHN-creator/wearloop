const express = require("express");

const {
  sendMessage,
  getMessages,
} = require("../controllers/messageController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Send a message
router.post(
  "/",
  authMiddleware,
  sendMessage
);

// Get messages for a swap
router.get(
  "/:swapRequestId",
  authMiddleware,
  getMessages
);

module.exports = router;