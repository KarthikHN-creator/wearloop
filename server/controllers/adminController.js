
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Clothing = require("../models/Clothing");
const SwapRequest = require("../models/SwapRequest");

// Validate MongoDB ID
const isValidId = (id) => mongoose.isValidObjectId(id);

// Get admin dashboard statistics
const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalClothing,
      availableClothing,
      totalSwaps,
      completedSwaps,
      pendingSwaps,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      Clothing.countDocuments(),
      Clothing.countDocuments({ status: "Available" }),
      SwapRequest.countDocuments(),
      SwapRequest.countDocuments({ status: "Completed" }),
      SwapRequest.countDocuments({ status: "Pending" }),
    ]);

    return res.status(200).json({
      totalUsers,
      totalClothing,
      availableClothing,
      totalSwaps,
      completedSwaps,
      pendingSwaps,
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    return res.status(500).json({
      message: "Failed to fetch admin statistics",
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      isDeleted: false,
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

// Get all clothing listings
const getAllClothing = async (req, res) => {
  try {
    const clothes = await Clothing.find()
      .populate("owner", "name email location")
      .sort({ createdAt: -1 });

    return res.status(200).json(clothes);
  } catch (error) {
    console.error("Get clothing error:", error);

    return res.status(500).json({
      message: "Failed to fetch clothing listings",
    });
  }
};

// Get all swap requests
const getAllSwaps = async (req, res) => {
  try {
    const swaps = await SwapRequest.find()
      .populate("requester", "name email")
      .populate("owner", "name email")
      .populate("offeredClothing", "title category value")
      .populate("requestedClothing", "title category value")
      .sort({ createdAt: -1 });

    return res.status(200).json(swaps);
  } catch (error) {
    console.error("Get swaps error:", error);

    return res.status(500).json({
      message: "Failed to fetch swap requests",
    });
  }
};

// Delete a clothing listing
const deleteClothingByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid clothing ID",
      });
    }

    const clothing = await Clothing.findById(id);

    if (!clothing) {
      return res.status(404).json({
        message: "Clothing listing not found",
      });
    }

    await Clothing.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Clothing listing removed successfully",
    });
  } catch (error) {
    console.error("Admin delete clothing error:", error);

    return res.status(500).json({
      message: "Failed to remove clothing listing",
    });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // Prevent changing your own role
    if (req.userId === id) {
      return res.status(400).json({
        message: "You cannot change your own admin role",
      });
    }

    const user = await User.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Prevent removing the last administrator
    if (user.role === "admin" && role === "user") {
      const adminCount = await User.countDocuments({
        role: "admin",
        isDeleted: false,
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot remove the last administrator",
        });
      }
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);

    return res.status(500).json({
      message: "Failed to update user role",
    });
  }
};

// Soft delete user account
const deleteUser = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    // Prevent admin from deleting their own account
    if (req.userId === id) {
      return res.status(400).json({
        message: "You cannot delete your own admin account",
      });
    }

    // Generate an unusable replacement password
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    await session.withTransaction(async () => {
      const user = await User.findOne({
        _id: id,
        isDeleted: false,
      }).session(session);

      if (!user) {
        const error = new Error("USER_NOT_FOUND");
        throw error;
      }

      // Protect the last administrator
      if (user.role === "admin") {
        const adminCount = await User.countDocuments({
          role: "admin",
          isDeleted: false,
        }).session(session);

        if (adminCount <= 1) {
          const error = new Error("LAST_ADMIN");
          throw error;
        }
      }

      // Archive the user's clothing
      await Clothing.updateMany(
        { owner: user._id },
        {
          $set: {
            status: "Archived",
          },
        },
        { session }
      );

      // Cancel active swap requests
      await SwapRequest.updateMany(
        {
          $or: [
            { requester: user._id },
            { owner: user._id },
          ],
          status: {
            $in: ["Pending", "Negotiating", "Accepted"],
          },
        },
        {
          $set: {
            status: "Cancelled",
          },
        },
        { session }
      );

      // Anonymize user information
      user.name = "Deleted member";
      user.email = `deleted-${user._id}@deleted.wearloop.invalid`;
      user.password = hashedPassword;
      user.location = "";
      user.profileImage = "";
      user.role = "user";
      user.isDeleted = true;
      user.deletedAt = new Date();

      await user.save({ session });
    });

    return res.status(200).json({
      message: "User account deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (error.message === "LAST_ADMIN") {
      return res.status(400).json({
        message: "Cannot delete the last administrator",
      });
    }

    return res.status(500).json({
      message: "Failed to delete user",
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  getAllClothing,
  getAllSwaps,
  deleteClothingByAdmin,
  updateUserRole,
  deleteUser,
};
