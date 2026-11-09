const express = require("express");

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// GET ALL MY NOTIFICATIONS
// GET /api/notifications
// =====================================================
router.get(
  "/",
  authMiddleware,
  getNotifications
);


// =====================================================
// GET UNREAD NOTIFICATION COUNT
// GET /api/notifications/unread-count
// =====================================================
router.get(
  "/unread-count",
  authMiddleware,
  getUnreadCount
);


// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/read-all
// =====================================================
router.patch(
  "/read-all",
  authMiddleware,
  markAllAsRead
);


// =====================================================
// MARK ONE NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// =====================================================
router.patch(
  "/:id/read",
  authMiddleware,
  markAsRead
);


// =====================================================
// DELETE NOTIFICATION
// DELETE /api/notifications/:id
// =====================================================
router.delete(
  "/:id",
  authMiddleware,
  deleteNotification
);


module.exports = router;