
const mongoose = require("mongoose");
const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
  try {
    // Check authenticated user ID
    if (!req.userId || !mongoose.isValidObjectId(req.userId)) {
      return res.status(401).json({
        message: "Invalid authentication",
      });
    }

    // Fetch only necessary user fields
    const user = await User.findById(req.userId)
      .select("name email role");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // Check admin role from database
    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    req.admin = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);

    return res.status(500).json({
      message: "Unable to verify admin access",
    });
  }
};

module.exports = adminMiddleware;
