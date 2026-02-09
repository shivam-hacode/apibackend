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
	try {
		// Get app version from header (check all possible cases)
		// Express normalizes headers to lowercase, so check lowercase first
		const appVersion = 
			req.headers['x-app-version'] || 
			req.headers['x-app-version'] ||
			req.get('X-App-Version') ||
			req.get('x-app-version');

		// Debug logging
		console.log(`[Version Check] ==========================================`);
		console.log(`[Version Check] Request to: ${req.method} ${req.path}`);
		console.log(`[Version Check] All headers with 'version':`, 
			Object.keys(req.headers)
				.filter(k => k.toLowerCase().includes('version'))
				.map(k => `${k}: ${req.headers[k]}`)
		);
		console.log(`[Version Check] App Version extracted:`, appVersion);

		// Get minimum required version (from DB or env, default 2.0.0)
		const minVersion = await appConfig.getRequiredVersion();
		console.log(`[Version Check] Minimum required version:`, minVersion);

		// Rule 1: Reject if header is missing
		if (!appVersion || appVersion.trim() === '') {
			console.warn(`[Version Check] ❌ BLOCKED - Missing X-App-Version header`);
			console.log(`[Version Check] ==========================================`);
			
			return res.status(426).json({
				forceUpdate: true,
				message: 'App update required. Please update to version 2.0.0 or higher.',
				changelog: 'Please update to the latest version for continued access.',
				minRequiredVersion: minVersion,
			});
		}

		// Trim whitespace
		const cleanVersion = appVersion.trim();

		// Rule 2: Validate version format using semver
		if (!semver.valid(cleanVersion)) {
			console.warn(`[Version Check] ❌ BLOCKED - Invalid version format: "${cleanVersion}"`);
			console.log(`[Version Check] ==========================================`);
			
			return res.status(426).json({
				forceUpdate: true,
				message: 'App update required. Please update to version 2.0.0 or higher.',
				changelog: 'Please update to the latest version for continued access.',
				minRequiredVersion: minVersion,
			});
		}

		// Rule 3: Check if version meets minimum requirement (must be >= 2.0.0)
		const isVersionValid = semver.gte(cleanVersion, minVersion);
		console.log(`[Version Check] Version comparison: "${cleanVersion}" >= "${minVersion}" = ${isVersionValid}`);
		console.log(`[Version Check] semver.gte("${cleanVersion}", "${minVersion}"):`, semver.gte(cleanVersion, minVersion));
		console.log(`[Version Check] semver.lt("${cleanVersion}", "${minVersion}"):`, semver.lt(cleanVersion, minVersion));

		if (!isVersionValid) {
			console.warn(`[Version Check] ❌ BLOCKED - Version ${cleanVersion} is below minimum ${minVersion}`);
			console.log(`[Version Check] ==========================================`);
			
			return res.status(426).json({
				forceUpdate: true,
				message: 'App update required. Please update to version 2.0.0 or higher.',
				changelog: 'Please update to the latest version for continued access.',
				minRequiredVersion: minVersion,
			});
		}

		// Version is valid (>= 2.0.0), proceed to next middleware
		console.log(`[Version Check] ✅ ALLOWED - Version ${cleanVersion} is valid (>= ${minVersion})`);
		console.log(`[Version Check] ==========================================`);
		next();
	} catch (error) {
		console.error(`[Version Check] ❌ ERROR:`, error);
		console.error(`[Version Check] Error stack:`, error.stack);
		console.log(`[Version Check] ==========================================`);
		// On error, block the request to be safe
		return res.status(426).json({
			forceUpdate: true,
			message: 'App update required. Please update to version 2.0.0 or higher.',
			changelog: 'Please update to the latest version for continued access.',
			minRequiredVersion: '2.0.0',
		});
	}
};

module.exports = versionCheckMiddleware;
