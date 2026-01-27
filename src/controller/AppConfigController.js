// controller/AppConfigController.js
const appConfig = require('../config/appConfig');

/**
 * Get app configuration endpoint
 * Returns version requirements and update information
 * This endpoint should be accessible without version check
 */
const getAppConfig = async (req, res) => {
	try {
		const config = await appConfig.getAppConfig();

		res.status(200).json(config);
	} catch (error) {
		console.error('Error getting app config:', error);
		res.status(500).json({
			message: 'Internal server error',
			error: error.message,
		});
	}
};

/**
 * Get version config endpoint
 * Returns version + otaUrl
 * Route: /app/version-config
 */
const getVersionConfig = async (req, res) => {
	try {
		const config = await appConfig.getAppConfig();
		
		res.status(200).json({
			version: config.version,
			otaUrl: config.otaUrl,
		});
	} catch (error) {
		console.error('Error getting version config:', error);
		res.status(500).json({
			message: 'Internal server error',
			error: error.message,
		});
	}
};

/**
 * Get OTA manifest endpoint
 * Returns OTA manifest file
 * Route: /ota/ota-manifest.json
 */
const getOtaManifest = async (req, res) => {
	try {
		const otaUrl = await appConfig.getOtaUrl();
		const config = await appConfig.getAppConfig();
		
		// Return OTA manifest structure
		const manifest = {
			version: config.version,
			otaUrl: otaUrl,
			minimumRequiredVersion: config.minimumRequiredVersion,
			forceUpdate: config.forceUpdate,
			timestamp: new Date().toISOString(),
		};

		res.status(200).json(manifest);
	} catch (error) {
		console.error('Error getting OTA manifest:', error);
		res.status(500).json({
			message: 'Internal server error',
			error: error.message,
		});
	}
};

module.exports = {
	getAppConfig,
	getVersionConfig,
	getOtaManifest,
};
