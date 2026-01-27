// middleware/versionMiddleware.js
const appConfig = require('../config/appConfig');
const semver = require('semver');

/**
 * Version Check Middleware
 * 
 * Rules:
 * - If no x-app-version header: allow through (for web clients)
 * - If version < minimum required: return 426 with forceUpdate JSON
 * - Otherwise: allow through
 * 
 * Usage:
 * Apply globally to all API routes to enforce mobile app version validation
 */
const versionCheckMiddleware = async (req, res, next) => {
	// Get app version from header (case-insensitive check)
	const appVersion = 
		req.headers['x-app-version'] || 
		req.headers['X-App-Version'] || 
		req.headers['X-APP-VERSION'];

	// If no header, allow through (for web clients)
	if (!appVersion) {
		return next();
	}

	// Get minimum required version (from DB or env)
	const minVersion = await appConfig.getRequiredVersion();

	// Validate version format using semver
	if (!semver.valid(appVersion)) {
		console.warn(`[Version Check] Invalid version format: ${appVersion}`);
		
		return res.status(426).json({
			success: false,
			forceUpdate: true,
			message: `Please update the app to version ${minVersion} or above to continue`,
			minimumVersion: minVersion,
		});
	}

	// Check if version meets minimum requirement
	if (semver.lt(appVersion, minVersion)) {
		console.warn(`[Version Check] Blocked request from ${req.path} - Version ${appVersion} is below minimum ${minVersion}`);
		
		return res.status(426).json({
			success: false,
			forceUpdate: true,
			message: `Please update the app to version ${minVersion} or above to continue`,
			minimumVersion: minVersion,
		});
	}

	// Version is valid (>= minimum), proceed to next middleware
	next();
};

module.exports = versionCheckMiddleware;
