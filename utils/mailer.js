require('dotenv').config();
const nodemailer = require('nodemailer');

// Setup SMTP transporter (Gmail example)
const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'craftaar0@gmail.com', // Get email from .env file
		pass: 'ynhm jojr cvpw bltd', // Get password from .env file
	},
	port: 567,
});

// Send OTP email
const sendOtpEmail = (email, otp) => {
	console.log('email::', email);

	const mailOptions = {
		from: 'craftaar0@gmail.com',
		to: email,
		subject: 'Your OTP Code',
		text: `Your OTP for registration is: ${otp}`,
	};

	return transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
