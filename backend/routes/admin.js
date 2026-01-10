const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Donation = require("../models/Donation");

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "supersecretkey";

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Admin-only middleware
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
}

// GET ALL USERS
router.get("/users", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// GET ALL DONATIONS
router.get("/donations", auth, adminOnly, async (req, res) => {
  try {
    const donations = await Donation.getAll();
    res.json(donations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch donations" });
  }
});

// GET STATS
router.get("/stats", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.getAll();
    const donations = await Donation.getAll();

    const totalUsers = users.length;
    const totalDonations = donations.length;

    // Filter counts for the Doughnut Chart
    const successCount = donations.filter(d => d.status === "success").length;
    const pendingCount = donations.filter(d => d.status === "pending").length;
    const failedCount = donations.filter(d => d.status === "failed").length;

    const totalAmount = donations
      .filter(d => d.status === "success")
      .reduce((sum, d) => sum + Number(d.amount), 0);

    // Send everything the frontend needs
    res.json({
      totalUsers,
      totalDonations,
      totalAmount,
      successCount,
      pendingCount,
      failedCount,
      // Also adding these for the PDF Report
      successAmount: totalAmount,
      pendingAmount: donations.filter(d => d.status === "pending").reduce((sum, d) => sum + Number(d.amount), 0),
      failedAmount: donations.filter(d => d.status === "failed").reduce((sum, d) => sum + Number(d.amount), 0)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

module.exports = router;
