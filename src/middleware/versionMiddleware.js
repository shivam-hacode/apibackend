// middleware/versionMiddleware.js
const appConfig = require('../config/appConfig');
const semver = require('semver');

/**
 * Strict Version Check Middleware
 * 
 * Rules:
 * - If X-App-Version header is missing: reject with 426
 * - If version < 2.0.0 (or minimum required): reject with 426
 * - If version >= 2.0.0: allow through
 * 
 * Usage:
 * Apply to specific API routes that require version validation
 */
const versionCheckMiddleware = async (req, res, next) => {
	// Get app version from header (case-insensitive check)
	const appVersion = 
		req.headers['x-app-version'] || 
		req.headers['X-App-Version'] || 
		req.headers['X-APP-VERSION'];

	// Get minimum required version (from DB or env, default 2.0.0)
	const minVersion = await appConfig.getRequiredVersion();

	// Rule 1: Reject if header is missing
	if (!appVersion) {
		console.warn(`[Version Check] Blocked request from ${req.path} - Missing X-App-Version header`);
		
		return res.status(426).json({
			forceUpdate: true,
			message: 'App update required. Please update to version 2.0.0 or higher.',
			changelog: 'Please update to the latest version for continued access.',
			minRequiredVersion: minVersion,
		});
	}

	// Rule 2: Validate version format using semver
	if (!semver.valid(appVersion)) {
		console.warn(`[Version Check] Invalid version format: ${appVersion}`);
		
		return res.status(426).json({
			forceUpdate: true,
			message: 'App update required. Please update to version 2.0.0 or higher.',
			changelog: 'Please update to the latest version for continued access.',
			minRequiredVersion: minVersion,
		});
	}

	// Rule 3: Check if version meets minimum requirement (must be >= 2.0.0)
	if (semver.lt(appVersion, minVersion)) {
		console.warn(`[Version Check] Blocked request from ${req.path} - Version ${appVersion} is below minimum ${minVersion}`);
		
		return res.status(426).json({
			forceUpdate: true,
			message: 'App update required. Please update to version 2.0.0 or higher.',
			changelog: 'Please update to the latest version for continued access.',
			minRequiredVersion: minVersion,
		});
	}

	// Version is valid (>= 2.0.0), proceed to next middleware
	next();
};

module.exports = versionCheckMiddleware;
