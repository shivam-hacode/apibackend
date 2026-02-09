// middleware/versionCheckMiddleware.js
const semver = require('semver');

/**
 * Version Check Middleware
 * 
 * Blocks API requests from mobile app versions lower than 2.0.0
 * 
 * Requirements:
 * - Header: x-app-version (e.g., "2.0.0")
 * - If missing or version < 2.0.0: returns 426 with forceUpdate JSON
 * - If version >= 2.0.0: allows request to proceed
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const versionCheckMiddleware = (req, res, next) => {
	// Minimum required version
	const MINIMUM_VERSION = '2.0.0';

	// Get version from header (Express normalizes headers to lowercase)
	const appVersion = req.headers['x-app-version'] || req.get('x-app-version');

	// Rule 1: Reject if header is missing
	if (!appVersion || appVersion.trim() === '') {
		return res.status(426).json({
			success: false,
			forceUpdate: true,
			message: 'Please update app from mdresult.com',
		});
	}

	// Clean and validate version format
	const cleanVersion = appVersion.trim();

	// Rule 2: Validate version format using semver
	if (!semver.valid(cleanVersion)) {
		return res.status(426).json({
			success: false,
			forceUpdate: true,
			message: 'Please update app from mdresult.com',
		});
	}

	// Rule 3: Check if version meets minimum requirement (must be >= 2.0.0)
	if (semver.lt(cleanVersion, MINIMUM_VERSION)) {
		return res.status(426).json({
			success: false,
			forceUpdate: true,
			message: 'Please update app from mdresult.com',
		});
	}

	// Version is valid (>= 2.0.0), proceed to next middleware
	next();
};

module.exports = versionCheckMiddleware;
