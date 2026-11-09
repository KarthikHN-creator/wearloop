
const mongoose = require("mongoose");

const SwapRequest = require("../models/SwapRequest");
const Clothing = require("../models/Clothing");
const Notification = require("../models/Notification");
const User = require("../models/User");

// =====================================================
// CREATE A SWAP REQUEST
// POST /api/swaps
// =====================================================

const createSwapRequest = async (req, res) => {
  try {
    const {
      owner,
      offeredClothing,
      requestedClothing,
      message,
    } = req.body;

    if (!owner || !offeredClothing || !requestedClothing) {
      return res.status(400).json({
        message: "Owner, offered clothing and requested clothing are required",
      });
    }

    const offeredItem = await Clothing.findById(offeredClothing);
    const requestedItem = await Clothing.findById(requestedClothing);

    if (!offeredItem || !requestedItem) {
      return res.status(404).json({
        message: "Clothing item not found",
      });
    }

    // Requester must own offered clothing
    if (offeredItem.owner.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can only offer your own clothing",
      });
    }

    // Requested clothing must belong to owner
    if (requestedItem.owner.toString() !== owner) {
      return res.status(400).json({
        message: "Requested clothing does not belong to this owner",
      });
    }

    // Prevent self swap
    if (
      offeredItem.owner.toString() ===
      requestedItem.owner.toString()
    ) {
      return res.status(400).json({
        message: "You cannot create a swap request for your own clothing",
      });
    }

    // Both items must be available
    if (
      offeredItem.status !== "Available" ||
      requestedItem.status !== "Available"
    ) {
      return res.status(400).json({
        message: "Both clothing items must be available",
      });
    }

    // Prevent duplicate pending request
    const existingSwap = await SwapRequest.findOne({
      requester: req.userId,
      owner,
      offeredClothing,
      requestedClothing,
      status: "Pending",
    });

    if (existingSwap) {
      return res.status(400).json({
        message: "You already have a pending swap request for these items",
      });
    }

    // Create swap request
    const swapRequest = await SwapRequest.create({
      requester: req.userId,
      owner,
      offeredClothing,
      requestedClothing,
      message: message || "",
      status: "Pending",
    });

    // Create notification
    try {
      await Notification.create({
        recipient: requestedItem.owner,
        sender: req.userId,
        type: "SWAP_REQUEST",
        title: "New Swap Request",
        message: "You received a new clothing swap request.",
        swapRequest: swapRequest._id,
        clothing: requestedItem._id,
      });

      console.log("Swap request notification created");
    } catch (notificationError) {
      console.error(
        "Failed to create swap notification:",
        notificationError
      );
    }

    return res.status(201).json({
      message: "Swap request created successfully",
      swapRequest,
    });
  } catch (error) {
    console.error("Create swap request error:", error);

    return res.status(500).json({
      message: "Failed to create swap request",
      error: error.message,
    });
  }
};


// =====================================================
// GET MY SWAP REQUESTS
// GET /api/swaps
// =====================================================

const getMySwapRequests = async (req, res) => {
  try {
    const swaps = await SwapRequest.find({
      $or: [
        { requester: req.userId },
        { owner: req.userId },
      ],
    })
      .populate("requester", "name email")
      .populate("owner", "name email")
      .populate("offeredClothing")
      .populate("requestedClothing")
      .sort({ createdAt: -1 });

    return res.status(200).json(swaps);
  } catch (error) {
    console.error("Get swap requests error:", error);

    return res.status(500).json({
      message: "Failed to fetch swap requests",
      error: error.message,
    });
  }
};


// =====================================================
// UPDATE SWAP STATUS
// PATCH /api/swaps/:id/status
// =====================================================

const updateSwapStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Negotiating",
      "Accepted",
      "Rejected",
      "Completed",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const swapRequest = await SwapRequest.findById(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({
        message: "Swap request not found",
      });
    }

    // Authorization
    if (
      swapRequest.requester.toString() !== req.userId &&
      swapRequest.owner.toString() !== req.userId
    ) {
      return res.status(403).json({
        message: "You are not authorized to update this swap",
      });
    }

    // Valid status transitions
    const currentStatus = swapRequest.status;

    const validTransitions = {
      Pending: ["Negotiating", "Accepted", "Rejected", "Cancelled"],
      Negotiating: ["Accepted", "Rejected", "Cancelled"],
      Accepted: ["Completed", "Cancelled"],
      Rejected: [],
      Completed: [],
      Cancelled: [],
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }

    // Complete swap
    if (status === "Completed") {
      const offeredClothing = await Clothing.findById(
        swapRequest.offeredClothing
      );

      const requestedClothing = await Clothing.findById(
        swapRequest.requestedClothing
      );

      if (!offeredClothing || !requestedClothing) {
        return res.status(404).json({
          message: "One or both clothing items were not found",
        });
      }

      offeredClothing.status = "Swapped";
      requestedClothing.status = "Swapped";

      await offeredClothing.save();
      await requestedClothing.save();
    }

    // Save new status
    swapRequest.status = status;
    await swapRequest.save();

    // Notifications
    if (status === "Accepted") {
      try {
        await Notification.create({
          recipient: swapRequest.requester,
          sender: req.userId,
          type: "SWAP_ACCEPTED",
          title: "Swap Request Accepted",
          message: "Your clothing swap request has been accepted.",
          swapRequest: swapRequest._id,
          clothing: swapRequest.requestedClothing,
        });
      } catch (notificationError) {
        console.error("Accepted notification error:", notificationError);
      }
    }

    if (status === "Rejected") {
      try {
        await Notification.create({
          recipient: swapRequest.requester,
          sender: req.userId,
          type: "SWAP_REJECTED",
          title: "Swap Request Rejected",
          message: "Your clothing swap request has been rejected.",
          swapRequest: swapRequest._id,
          clothing: swapRequest.requestedClothing,
        });
      } catch (notificationError) {
        console.error("Rejected notification error:", notificationError);
      }
    }

    if (status === "Cancelled") {
      try {
        const recipient =
          swapRequest.requester.toString() === req.userId
            ? swapRequest.owner
            : swapRequest.requester;

        await Notification.create({
          recipient,
          sender: req.userId,
          type: "SWAP_CANCELLED",
          title: "Swap Cancelled",
          message: "A clothing swap has been cancelled.",
          swapRequest: swapRequest._id,
          clothing: swapRequest.requestedClothing,
        });
      } catch (notificationError) {
        console.error("Cancelled notification error:", notificationError);
      }
    }

    if (status === "Completed") {
      try {
        await Notification.create({
          recipient: swapRequest.requester,
          sender: req.userId,
          type: "SWAP_COMPLETED",
          title: "Swap Completed",
          message: "Your clothing swap has been completed.",
          swapRequest: swapRequest._id,
          clothing: swapRequest.requestedClothing,
        });

        await Notification.create({
          recipient: swapRequest.owner,
          sender: req.userId,
          type: "SWAP_COMPLETED",
          title: "Swap Completed",
          message: "Your clothing swap has been completed.",
          swapRequest: swapRequest._id,
          clothing: swapRequest.requestedClothing,
        });
      } catch (notificationError) {
        console.error("Completed notification error:", notificationError);
      }
    }

    return res.status(200).json({
      message: `Swap request ${status.toLowerCase()} successfully`,
      swapRequest,
    });
  } catch (error) {
    console.error("Update swap status error:", error);

    return res.status(500).json({
      message: "Failed to update swap status",
      error: error.message,
    });
  }
};


// =====================================================
// SUBMIT SWAP REVIEW
// POST /api/swaps/:id/reviews
// =====================================================

const submitSwapReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const reviewerId = req.userId;

    // Validate rating
    const numericRating = Number(rating);

    if (
      rating === undefined ||
      rating === null ||
      rating === "" ||
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be a whole number between 1 and 5",
      });
    }

    if (
      comment !== undefined &&
      typeof comment !== "string"
    ) {
      return res.status(400).json({
        message: "Review comment must be text",
      });
    }

    if (comment && comment.trim().length > 500) {
      return res.status(400).json({
        message: "Review comment cannot exceed 500 characters",
      });
    }

    // Find swap
    const swapRequest = await SwapRequest.findById(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({
        message: "Swap request not found",
      });
    }

    // Only completed swaps can be reviewed
    if (swapRequest.status !== "Completed") {
      return res.status(400).json({
        message: "Only completed swaps can be reviewed",
      });
    }

    const requesterId = swapRequest.requester.toString();
    const ownerId = swapRequest.owner.toString();

    // Identify reviewer and recipient
    let revieweeId;

    if (reviewerId === requesterId) {
      revieweeId = ownerId;
    } else if (reviewerId === ownerId) {
      revieweeId = requesterId;
    } else {
      return res.status(403).json({
        message: "You are not a participant in this swap",
      });
    }

    // Prevent duplicate review from the same participant
    const alreadyReviewed = swapRequest.reviews.some(
      (review) => review.reviewer.toString() === reviewerId
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        message: "You have already reviewed this swap",
      });
    }

    // Save review
    swapRequest.reviews.push({
      reviewer: reviewerId,
      reviewee: revieweeId,
      rating: numericRating,
      comment: comment?.trim() || "",
      reviewedAt: new Date(),
    });

    await swapRequest.save();

    // Calculate recipient's average rating from all completed swaps
    const result = await SwapRequest.aggregate([
      {
        $match: {
          status: "Completed",
        },
      },
      {
        $unwind: "$reviews",
      },
      {
        $match: {
          "reviews.reviewee": new mongoose.Types.ObjectId(revieweeId),
        },
      },
      {
        $group: {
          _id: "$reviews.reviewee",
          averageRating: {
            $avg: "$reviews.rating",
          },
          reviewCount: {
            $sum: 1,
          },
        },
      },
    ]);

    const averageRating = result.length
      ? Number(result[0].averageRating.toFixed(1))
      : 0;

    // Update user rating
    await User.findByIdAndUpdate(revieweeId, {
      rating: averageRating,
    });

    return res.status(201).json({
      message: "Review submitted successfully",
      review: swapRequest.reviews[
        swapRequest.reviews.length - 1
      ],
      averageRating,
      reviewCount: result[0]?.reviewCount || 0,
    });
  } catch (error) {
    console.error("Submit swap review error:", error);

    return res.status(500).json({
      message: "Failed to submit review",
      error: error.message,
    });
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createSwapRequest,
  getMySwapRequests,
  updateSwapStatus,
  submitSwapReview,
};
