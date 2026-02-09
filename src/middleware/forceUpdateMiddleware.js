// middleware/forceUpdateMiddleware.js

/**
 * Force Update Middleware
 * 
 * Detects old mobile app versions and forces them to update
 * Uses user-agent and other headers to identify old mobile apps
 * 
 * Behavior:
 * - Detects old mobile apps via user-agent patterns
 * - Returns HTTP 400 (error status) with forceUpdate JSON so app's error handler can show it
 * - Allows web browsers and new apps to proceed normally
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const forceUpdateMiddleware = (req, res, next) => {
	// Update URL
	const UPDATE_URL = 'https://mdresult.com';

	// Get headers (Express normalizes to lowercase)
	const userAgent = (req.headers['user-agent'] || '').toLowerCase();
	const origin = (req.headers['origin'] || '').toLowerCase();
	const referer = (req.headers['referer'] || '').toLowerCase();

	// Check if request is from a web browser
	const isWebBrowser = isBrowserRequest(userAgent, origin, referer);

	// If it's a web browser, allow through
	if (isWebBrowser) {
		return next();
	}

	// Check if request is from a mobile app (old app patterns)
	const isOldMobileApp = isOldMobileAppRequest(userAgent, origin, referer);

	// If detected as old mobile app, force update
	// Return error status (400) so app's error handler can catch and show it in alert/prompt
	if (isOldMobileApp) {
		return res.status(400).json({
			success: false,
			forceUpdate: true,
			message: 'A new version of the app is available. Please update from https://mdresult.com',
			updateUrl: UPDATE_URL,
			error: 'App update required',
			// Additional fields for app error handler
			data: {
				forceUpdate: true,
				updateUrl: UPDATE_URL,
			},
		});
	}

	// If not detected as old app or browser, allow through (could be new app)
	next();
};

/**
 * Check if request is from a web browser
 * @param {string} userAgent - User agent string
 * @param {string} origin - Origin header
 * @param {string} referer - Referer header
 * @returns {boolean} True if request is from browser
 */
function isBrowserRequest(userAgent, origin, referer) {
	// Common browser user-agent patterns
	const browserPatterns = [
		'mozilla',
		'chrome',
		'safari',
		'firefox',
		'edge',
		'opera',
		'msie',
		'trident',
		'webkit',
	];

	// Check if user-agent contains browser patterns
	const hasBrowserPattern = browserPatterns.some(pattern => 
		userAgent.includes(pattern)
	);

	// Check if origin/referer suggests web browser
	const hasWebOrigin = origin.includes('http://') || origin.includes('https://');
	const hasWebReferer = referer.includes('http://') || referer.includes('https://');

	// If user-agent looks like browser AND has web origin/referer, it's a browser
	if (hasBrowserPattern && (hasWebOrigin || hasWebReferer)) {
		return true;
	}

	// If user-agent is clearly a browser (even without origin), allow
	if (hasBrowserPattern && userAgent.includes('mozilla') && !userAgent.includes('mobile')) {
		return true;
	}

	return false;
}

/**
 * Check if request is from an old mobile app
 * @param {string} userAgent - User agent string
 * @param {string} origin - Origin header
 * @param {string} referer - Referer header
 * @returns {boolean} True if request is from old mobile app
 */
function isOldMobileAppRequest(userAgent, origin, referer) {
	// Common mobile app user-agent patterns (old apps)
	const oldAppPatterns = [
		// React Native / Expo patterns
		'expo',
		'react-native',
		// Android app patterns
		'okhttp',           // Android HTTP client (old apps)
		'dalvik',           // Android runtime
		'android',          // Android (if not browser)
		// iOS app patterns
		'cfnetwork',        // iOS networking (old apps)
		'ios',              // iOS (if not Safari browser)
		// Custom app identifiers (add your app's user-agent patterns here)
		'mdresult',         // Your app identifier
		'md-result',
		// Generic mobile app patterns
		'mobile-app',
		'app-version',
	];

	// Check if user-agent matches old app patterns
	const matchesOldApp = oldAppPatterns.some(pattern => 
		userAgent.includes(pattern)
	);

	// If user-agent matches old app pattern, it's an old app
	if (matchesOldApp) {
		return true;
	}

	// Additional check: If no browser patterns AND no web origin, likely mobile app
	const browserPatterns = ['mozilla', 'chrome', 'safari', 'firefox', 'edge'];
	const hasBrowserPattern = browserPatterns.some(pattern => userAgent.includes(pattern));
	const hasWebOrigin = origin.includes('http://') || origin.includes('https://');

	// If no browser pattern and no web origin, likely old mobile app
	if (!hasBrowserPattern && !hasWebOrigin && userAgent.length > 0) {
		return true;
	}

	return false;
}

module.exports = forceUpdateMiddleware;
