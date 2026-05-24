const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "", trim: true },
    badge: { type: String, default: "", trim: true },
    ctaLabel: { type: String, default: "Shop now", trim: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: false },
    image: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    sortOrder: { type: Number, default: 0, index: true },
    startsAt: { type: Date, required: false },
    endsAt: { type: Date, required: false },
  },
  { timestamps: true }
);

bannerSchema.index({ status: 1, sortOrder: 1, createdAt: -1 });

module.exports = mongoose.model("Banner", bannerSchema);
