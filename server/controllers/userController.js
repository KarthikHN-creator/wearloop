
const mongoose = require("mongoose");

const User = require("../models/User");
const Clothing = require("../models/Clothing");
const SwapRequest = require("../models/SwapRequest");
const cloudinary = require("../config/cloudinary");

// =========================================
// GET USER PROFILE
// =========================================

const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.userId,
      isDeleted: { $ne: true },
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [clothingCount, completedSwaps, reviewStats] =
      await Promise.all([
        Clothing.countDocuments({ owner: user._id }),

        SwapRequest.countDocuments({
          $or: [
            { requester: user._id },
            { owner: user._id },
          ],
          status: "Completed",
        }),

        SwapRequest.aggregate([
          { $match: { status: "Completed" } },
          { $unwind: "$reviews" },
          { $match: { "reviews.reviewee": user._id } },
          {
            $group: {
              _id: null,
              reviewCount: { $sum: 1 },
              averageRating: { $avg: "$reviews.rating" },
            },
          },
        ]),
      ]);

    const reviewCount = reviewStats[0]?.reviewCount || 0;

    const rating = reviewCount
      ? Number(reviewStats[0].averageRating.toFixed(1))
      : 0;

    return res.status(200).json({
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      location: user.location || "",
      profileImage: user.profileImage || "",
      rating,
      reviewCount,
      totalSwaps: user.totalSwaps || 0,
      clothingCount,
      completedSwaps,
      role: user.role || "user",
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
};

// =========================================
// GET PUBLIC MEMBER PROFILE
// =========================================

const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid member ID",
      });
    }

    const user = await User.findOne({
      _id: userId,
      isDeleted: { $ne: true },
    }).select("name location profileImage createdAt");

    if (!user) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    const [clothingCount, completedSwaps, reviewStats, reviews] =
      await Promise.all([
        Clothing.countDocuments({
          owner: user._id,
          status: "Available",
        }),

        SwapRequest.countDocuments({
          $or: [
            { requester: user._id },
            { owner: user._id },
          ],
          status: "Completed",
        }),

        SwapRequest.aggregate([
          { $match: { status: "Completed" } },
          { $unwind: "$reviews" },
          { $match: { "reviews.reviewee": user._id } },
          {
            $group: {
              _id: null,
              reviewCount: { $sum: 1 },
              averageRating: { $avg: "$reviews.rating" },
            },
          },
        ]),

        SwapRequest.find({
          status: "Completed",
          "reviews.reviewee": user._id,
        })
          .populate("reviews.reviewer", "name profileImage")
          .select("reviews"),
      ]);

    const reviewCount = reviewStats[0]?.reviewCount || 0;

    const rating = reviewCount
      ? Number(reviewStats[0].averageRating.toFixed(1))
      : 0;

    const memberReviews = reviews
      .flatMap((swap) => swap.reviews)
      .filter(
        (review) =>
          review.reviewee.toString() === user._id.toString()
      )
      .map((review) => ({
        reviewer: review.reviewer
          ? {
              name: review.reviewer.name,
              profileImage: review.reviewer.profileImage || "",
            }
          : {
              name: "WearLoop Member",
              profileImage: "",
            },
        rating: review.rating,
        comment: review.comment,
        reviewedAt: review.reviewedAt,
      }))
      .sort(
        (a, b) =>
          new Date(b.reviewedAt) - new Date(a.reviewedAt)
      );

    return res.status(200).json({
      id: user._id.toString(),
      name: user.name,
      location: user.location || "",
      profileImage: user.profileImage || "",
      createdAt: user.createdAt,
      clothingCount,
      completedSwaps,
      isVerifiedSwapMember: completedSwaps >= 1,
      rating,
      reviewCount,
      reviews: memberReviews,
    });
  } catch (error) {
    console.error("Get public profile error:", error);

    return res.status(500).json({
      message: "Failed to fetch member profile",
    });
  }
};

// =========================================
// UPDATE USER PROFILE
// =========================================

const updateProfile = async (req, res) => {
  try {
    const { name, location, profileImage } = req.body;

    const user = await User.findOne({
      _id: req.userId,
      isDeleted: { $ne: true },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Validate name
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Name cannot be empty",
        });
      }

      if (name.trim().length > 80) {
        return res.status(400).json({
          message: "Name cannot exceed 80 characters",
        });
      }

      user.name = name.trim();
    }

    // Validate location
    if (location !== undefined) {
      if (typeof location !== "string") {
        return res.status(400).json({
          message: "Invalid location",
        });
      }

      if (location.trim().length > 120) {
        return res.status(400).json({
          message: "Location cannot exceed 120 characters",
        });
      }

      user.location = location.trim();
    }

    // Validate profile image URL
    if (profileImage !== undefined) {
      if (
        typeof profileImage !== "string" ||
        profileImage.length > 2048
      ) {
        return res.status(400).json({
          message: "Invalid profile image",
        });
      }

      const imageUrl = profileImage.trim();

      if (imageUrl) {
        try {
          const parsedUrl = new URL(imageUrl);

          if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return res.status(400).json({
              message: "Invalid profile image URL",
            });
          }
        } catch {
          return res.status(400).json({
            message: "Invalid profile image URL",
          });
        }
      }

      user.profileImage = imageUrl;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        location: user.location || "",
        profileImage: user.profileImage || "",
        rating: user.rating || 0,
        totalSwaps: user.totalSwaps || 0,
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid profile information",
      });
    }

    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

// =========================================
// UPLOAD PROFILE IMAGE
// =========================================

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image",
      });
    }

    const user = await User.findOne({
      _id: req.userId,
      isDeleted: { $ne: true },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "clothswap/profiles",
          resource_type: "image",
          timeout: 60000,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (!result?.secure_url) {
            reject(
              new Error("Cloudinary did not return an image URL")
            );
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(req.file.buffer);
    });

    user.profileImage = uploadResult.secure_url;

    await user.save();

    return res.status(200).json({
      message: "Profile image uploaded successfully",
      profileImage: user.profileImage,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        location: user.location || "",
        profileImage: user.profileImage,
        rating: user.rating || 0,
        totalSwaps: user.totalSwaps || 0,
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("Upload profile image error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid profile information",
      });
    }

    return res.status(500).json({
      message: "Failed to upload profile image",
    });
  }
};

// =========================================
// EXPORT
// =========================================

module.exports = {
  getProfile,
  getPublicProfile,
  updateProfile,
  uploadProfileImage,
};
