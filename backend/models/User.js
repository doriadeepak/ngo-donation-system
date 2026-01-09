const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    }
  },
  { timestamps: true }
);

// Static helper methods (to match old API)
UserSchema.statics.createUser = function (userData) {
  return this.create(userData);
};

UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email });
};

UserSchema.statics.findByIdCustom = function (id) {
  return this.findById(id);
};

UserSchema.statics.getAll = function () {
  return this.find({});
};

module.exports = mongoose.model("User", UserSchema);
