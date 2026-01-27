// routes/authRoutes.js
const express = require("express");
const {
  login,
  verifyOtp,
  resetpassword,
  generateOtp,
} = require("../controller/AuthController");

const loginrouter = express.Router();

loginrouter.post("/login", login);
// Route: POST /api/auth/verify-otp
loginrouter.post("/verify-otp", verifyOtp);

// Route: POST /api/auth/resetpassword
loginrouter.post("/resetpassword", resetpassword);
loginrouter.post("/generate-otp", generateOtp);

module.exports = loginrouter;
