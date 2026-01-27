// controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user'); // ← import your Mongoose model
const { sendOtpEmail } = require('../../utils/mailer');
require('dotenv').config();

// Generate JWT
const generateAuthCode = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// POST /login
const login = async (req, res) => {
	const { email, password } = req.body;

	try {
		// 1) Find user by email
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		// 2) Compare password
		const isMatch = await user.matchPassword(password);
		if (!isMatch) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		// 3) Issue token
		const token = generateAuthCode(user.id);
		return res.json({ message: 'Login successful', authCode: token });
	} catch (err) {
		console.error('Login error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
};

// POST /resetpassword
// Body: { email, oldPassword, newPassword }
const resetpassword = async (req, res) => {
	const { email, oldPassword, newPassword } = req.body;
	try {
		// 1) Find user
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ message: 'Invalid email' });
		}

		// 3) Update to new password
		user.password = newPassword; // pre('save') hook will hash it
		await user.save();

		// 4) Issue new token
		const token = generateAuthCode(user.id);
		return res.json({ message: 'Password reset successful', authCode: token });
	} catch (err) {
		console.error('Reset password error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
};

const generateOtp = async (req, res) => {
	const { email } = req.body;
	try {
		// 1) Find user by email
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json({ message: 'No user with that email' });
		}

		// 2) Generate a 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();

		// 3) Set expiry (10 minutes from now)
		const ttlMs = 10 * 60 * 1000;
		const now = Date.now();
		const expiry = new Date(now + ttlMs);

		// 4) Save to user document
		user.otp = otp;
		user.otpExpiry = expiry;
		user.authenticated = false; // reset any prior flag
		await user.save();
		sendOtpEmail(email, otp);
		// 5) TODO: send OTP via email/SMS here
		// await sendOtpEmail(user.email, otp);

		return res.json({ message: 'OTP generated successfully' });
	} catch (err) {
		console.error('Generate OTP error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
};

// POST /verifyOtp
// Body: { email, otp }
const verifyOtp = async (req, res) => {
	const { email, otp } = req.body;
	console.log(email, otp);
	try {
		// 1) Find user with matching email & OTP
		const user = await User.findOne({ email, otp });
		if (!user) {
			return res.status(404).json({ message: 'User not found or wrong OTP' });
		}

		// 2) Check expiry
		if (!user.otpExpiry || user.otpExpiry < Date.now()) {
			return res.status(400).json({ message: 'OTP has expired' });
		}

		// 3) Mark authenticated and clear OTP fields
		user.authenticated = true;
		user.otp = null;
		user.otpExpiry = null;
		await user.save();

		return res.json({
			message: 'OTP verified successfully. Account activated.',
		});
	} catch (err) {
		console.error('Verify OTP error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
};

module.exports = {
	login,
	resetpassword,
	verifyOtp,
	generateOtp,
};
