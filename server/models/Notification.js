const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // User who should receive the notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // User who caused the notification
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Notification type
    type: {
      type: String,
      enum: [
        "SWAP_REQUEST",
        "SWAP_ACCEPTED",
        "SWAP_REJECTED",
        "SWAP_COMPLETED",
        "NEW_MESSAGE",
        "SWAP_CANCELLED",
      ],
      required: true,
    },

    // Notification title
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Notification message
    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Related swap request
    swapRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SwapRequest",
      default: null,
    },

    // Related clothing item
    clothing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clothing",
      default: null,
    },

    // Whether user has opened/read it
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);