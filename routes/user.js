const express = require("express");
const router = express.Router();
const db = require("../db"); // your DB connection

// Get all registered platform users
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT UserID, Name, Email FROM users");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

module.exports = router;
