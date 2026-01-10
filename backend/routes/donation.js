const express = require("express");
const jwt = require("jsonwebtoken");
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

// CREATE DONATION
router.post("/create", auth, async (req, res) => {
  try {
    const { amount } = req.body;

    const donation = await Donation.createDonation({
      userId: req.user.id,
      amount: Number(amount)
    });

    res.json({ message: "Donation recorded", donation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Donation failed" });
  }
});

// USER DONATION HISTORY
router.get("/my-donations", auth, async (req, res) => {
  try {
    const donations = await Donation.getByUser(req.user.id);
    res.json(donations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch donations" });
  }
});

// MOCK PAYMENT VERIFICATION (Add this!)
router.post("/verify-mock", async (req, res) => {
  try {
    const { donationId } = req.body;
    
    // Find the donation and update it to success
    // Note: Use your specific Mongoose/Model update logic here
    const donation = await Donation.findByIdAndUpdate(
      donationId,
      { status: "success", paymentId: "MOCK_" + Date.now() },
      { new: true }
    );

    if (!donation) return res.status(404).json({ message: "Donation not found" });

    res.json({ message: "Simulated Success", donation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
});

module.exports = router;
