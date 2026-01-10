require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());


// Limit each IP to 100 requests every 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes."
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

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

// Global Error Handler - MUST be the last app.use()
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the detailed error on the server console

  // Send a clean JSON response to the user
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined // Only show error details in dev mode
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
