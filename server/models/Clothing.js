const mongoose = require("mongoose");

const clothingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "T-Shirt",
        "Shirt",
        "Jeans",
        "Trousers",
        "Jacket",
        "Dress",
        "Skirt",
        "Sweater",
        "Hoodie",
        "Other",
      ],
    },

    size: {
      type: String,
      required: true,
      enum: ["XS", "S", "M", "L", "XL", "XXL"],
    },

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    condition: {
      type: String,
      required: true,
      enum: [
        "New",
        "Like New",
        "Good",
        "Fair",
      ],
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    value: {
      type: Number,
      default: 0,
      min: 0,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Available",
        "Reserved",
        "Swapped",
        "Archived",
      ],
      default: "Available",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Clothing", clothingSchema);