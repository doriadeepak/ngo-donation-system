const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending"
    },
    transactionId: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Static helper methods (to match old API)
DonationSchema.statics.createDonation = function (data) {
  return this.create(data);
};

DonationSchema.statics.getAll = function () {
  return this.find({}).sort({ createdAt: -1 });
};

DonationSchema.statics.getByUser = function (userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model("Donation", DonationSchema);
