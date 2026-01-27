// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
	const authHeader = req.headers['authorization'];

	if (!authHeader)
		return res.status(401).json({ message: 'Auth code required' });

	const token = authHeader.split(' ')[1];

	if (!token) return res.status(401).json({ message: 'Invalid auth code' });

	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		req.user = payload;
		next();
	} catch (err) {
		res.status(403).json({ message: 'Invalid or expired auth code' });
	}
};

module.exports = authenticate;
