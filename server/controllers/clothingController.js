
const mongoose = require("mongoose");

const Clothing = require("../models/Clothing");
const SwapRequest = require("../models/SwapRequest");

// =========================================
// HELPER FUNCTIONS
// =========================================

const isValidId = (id) => mongoose.isValidObjectId(id);

const handleControllerError = (res, error, message) => {
  console.error(message, error);

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid clothing information",
    });
  }

  return res.status(500).json({
    message,
  });
};

const validateStringField = (value, fieldName, maxLength) => {
  if (typeof value !== "string") {
    return `${fieldName} must be a string`;
  }

  if (value.trim().length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }

  return null;
};

const validateValue = (value) => {
  if (value === undefined || value === null || value === "") {
    return { valid: true, value: 0 };
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return { valid: false };
  }

  return { valid: true, value: numericValue };
};

const stringLimits = {
  title: 120,
  brand: 80,
  description: 1000,
  location: 120,
  image: 2048,
};

// =========================================
// ADD CLOTHING
// =========================================

const addClothing = async (req, res) => {
  try {
    const {
      title,
      category,
      size,
      brand,
      condition,
      description,
      value,
      location,
      image,
    } = req.body || {};

    if (!title || !category || !size || !condition) {
      return res.status(400).json({
        message: "Title, category, size and condition are required",
      });
    }

    const fields = {
      title,
      brand: brand ?? "",
      description: description ?? "",
      location: location ?? "",
      image: image ?? "",
    };

    for (const [field, fieldValue] of Object.entries(fields)) {
      const error = validateStringField(
        fieldValue,
        field,
        stringLimits[field]
      );

      if (error) {
        return res.status(400).json({ message: error });
      }
    }

    const validatedValue = validateValue(value);

    if (!validatedValue.valid) {
      return res.status(400).json({
        message: "Clothing value must be a valid non-negative number",
      });
    }

    const clothing = await Clothing.create({
      title: title.trim(),
      category,
      size,
      brand: brand?.trim() || "",
      condition,
      description: description?.trim() || "",
      value: validatedValue.value,
      location: location?.trim() || "",
      image: image?.trim() || "",
      owner: req.userId,
    });

    return res.status(201).json({
      message: "Clothing added successfully",
      clothing,
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Failed to add clothing"
    );
  }
};

// =========================================
// GET ALL CLOTHING
// =========================================

const getClothes = async (req, res) => {
  try {
    const clothes = await Clothing.find({
      status: { $ne: "Archived" },
    })
      .populate({
        path: "owner",
        select: "name email location",
        match: { isDeleted: false },
      })
      .sort({ createdAt: -1 });

    // Hide listings belonging to deleted or unavailable accounts.
    const activeClothes = clothes.filter((item) => item.owner);

    return res.status(200).json(activeClothes);
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Failed to fetch clothing"
    );
  }
};

// =========================================
// GET CLOTHING BY ID
// =========================================

const getClothingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid clothing ID",
      });
    }

    const clothing = await Clothing.findOne({
      _id: id,
      status: { $ne: "Archived" },
    }).populate({
      path: "owner",
      select: "name email location",
      match: { isDeleted: false },
    });

    if (!clothing || !clothing.owner) {
      return res.status(404).json({
        message: "Clothing not found",
      });
    }

    return res.status(200).json(clothing);
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Failed to fetch clothing"
    );
  }
};

// =========================================
// DELETE CLOTHING
// =========================================

const deleteClothing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid clothing ID",
      });
    }

    const clothing = await Clothing.findById(id);

    if (!clothing || clothing.status === "Archived") {
      return res.status(404).json({
        message: "Clothing not found",
      });
    }

    if (clothing.owner.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can only delete your own clothing",
      });
    }

    if (clothing.status === "Swapped") {
      return res.status(409).json({
        message: "Completed clothing cannot be removed",
      });
    }

    // Preserve clothing referenced by existing swap history.
    const activeSwap = await SwapRequest.exists({
      $or: [
        { offeredClothing: clothing._id },
        { requestedClothing: clothing._id },
      ],
      status: { $in: ["Pending", "Negotiating", "Accepted"] },
    });

    if (activeSwap) {
      return res.status(409).json({
        message: "This clothing has an active swap request and cannot be removed",
      });
    }

    // Archive instead of permanently deleting the document.
    clothing.status = "Archived";
    await clothing.save();

    return res.status(200).json({
      message: "Clothing deleted successfully",
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Failed to delete clothing"
    );
  }
};

// =========================================
// UPDATE CLOTHING
// =========================================

const updateClothing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid clothing ID",
      });
    }

    const clothing = await Clothing.findById(id);

    if (!clothing || clothing.status === "Archived") {
      return res.status(404).json({
        message: "Clothing not found",
      });
    }

    if (clothing.owner.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can only edit your own clothing",
      });
    }

    if (clothing.status !== "Available") {
      return res.status(409).json({
        message: "Only available clothing can be edited",
      });
    }

    const allowedFields = [
      "title",
      "category",
      "size",
      "brand",
      "condition",
      "description",
      "value",
      "location",
      "image",
    ];

    const updates = req.body || {};

    for (const field of allowedFields) {
      if (updates[field] === undefined) {
        continue;
      }

      if (field === "value") {
        const validatedValue = validateValue(updates.value);

        if (!validatedValue.valid) {
          return res.status(400).json({
            message: "Clothing value must be a valid non-negative number",
          });
        }

        clothing.value = validatedValue.value;
        continue;
      }

      const error = validateStringField(
        updates[field],
        field,
        stringLimits[field] ?? 120
      );

      if (error) {
        return res.status(400).json({ message: error });
      }

      clothing[field] = updates[field].trim();
    }

    await clothing.save();

    return res.status(200).json({
      message: "Clothing updated successfully",
      clothing,
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Failed to update clothing"
    );
  }
};

// =========================================
// GET RECOMMENDED CLOTHING
// =========================================

const getRecommendedClothing = async (req, res) => {
  try {
    const userClothes = await Clothing.find({
      owner: req.userId,
      status: "Available",
    });

    if (userClothes.length === 0) {
      return res.status(200).json([]);
    }

    const categories = [
      ...new Set(userClothes.map((item) => item.category)),
    ];

    const sizes = [
      ...new Set(userClothes.map((item) => item.size)),
    ];

    const recommendations = await Clothing.find({
      owner: { $ne: req.userId },
      status: "Available",
      category: { $in: categories },
      size: { $in: sizes },
    })
      .populate({
        path: "owner",
        select: "name location rating",
        match: { isDeleted: false },
      })
      .sort({ createdAt: -1 })
      .limit(20);

    const activeRecommendations = recommendations.filter(
      (item) => item.owner
    );

    return res.status(200).json(activeRecommendations);
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Failed to get recommendations"
    );
  }
};

// =========================================
// EXPORT
// =========================================

module.exports = {
  addClothing,
  getClothes,
  getClothingById,
  deleteClothing,
  updateClothing,
  getRecommendedClothing,
};
