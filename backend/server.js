require("dotenv").config();
const mongoose = require("mongoose");

const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const authRoutes = require("./routes/auth");
const donationRoutes = require("./routes/donation");
const adminRoutes = require("./routes/admin");

app.use("/api/auth", authRoutes);
app.use("/api/donation", donationRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("NGO Donation Backend is running");
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
