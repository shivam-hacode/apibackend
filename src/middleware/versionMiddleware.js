// middleware/versionMiddleware.js
const appConfig = require('../config/appConfig');

/**
 * Strict Version Check Middleware
 * 
 * Rules:
 * - Blocks requests if x-app-version header is missing
 * - Blocks requests if version is lower than minimum required (2.0.0)
 * - Only allows versions >= 2.0.0 (semantic versioning)
 * - Returns HTTP 426 (Upgrade Required) with standardized error response
 * 
 * Usage:
 * Apply globally to all API routes to enforce mobile app version validation
 */
const versionCheckMiddleware = (req, res, next) => {
	// Get app version from header (case-insensitive check)
	const appVersion = 
		req.headers['x-app-version'] || 
		req.headers['X-App-Version'] || 
		req.headers['X-APP-VERSION'];

	const minVersion = appConfig.getRequiredVersion();

	// Rule 1: Block if header is missing
	if (!appVersion) {
		console.warn(`[Version Check] Blocked request from ${req.path} - Missing x-app-version header`);
		
		return res.status(426).json({
			success: false,
			message: `Please update the app to version ${minVersion} or above to continue`,
		});
	}

	// Rule 2: Validate version format (should be semantic version like "2.0.0")
	const versionPattern = /^\d+\.\d+\.\d+/;
	if (!versionPattern.test(appVersion)) {
		console.warn(`[Version Check] Blocked request from ${req.path} - Invalid version format: ${appVersion}`);
		
		return res.status(426).json({
			success: false,
			message: `Please update the app to version ${minVersion} or above to continue`,
		});
	}

	// Rule 3: Check if version meets minimum requirement (semantic comparison)
	const isAllowed = appConfig.isVersionAllowed(appVersion);

	// Log version check (useful for debugging)
	if (process.env.NODE_ENV === 'development') {
		console.log(`[Version Check] ${req.path} - Version: ${appVersion}, Minimum: ${minVersion}, Allowed: ${isAllowed}`);
	}

	// Rule 4: Block if version is lower than minimum
	if (!isAllowed) {
		console.warn(`[Version Check] Blocked request from ${req.path} - Version ${appVersion} is below minimum ${minVersion}`);
		
		return res.status(426).json({
			success: false,
			message: `Please update the app to version ${minVersion} or above to continue`,
		});
	}

	// Version is valid (>= 2.0.0), proceed to next middleware
	next();
};

module.exports = versionCheckMiddleware;
