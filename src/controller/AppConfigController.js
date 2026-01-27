// controller/AppConfigController.js
const appConfig = require('../config/appConfig');

/**
 * Get app configuration endpoint
 * Returns version requirements and update information
 * This endpoint should be accessible without version check
 */
const getAppConfig = (req, res) => {
	try {
		const config = appConfig.getAppConfig();

		res.status(200).json(config);
	} catch (error) {
		console.error('Error getting app config:', error);
		res.status(500).json({
			message: 'Internal server error',
			error: error.message,
		});
	}
};

module.exports = {
	getAppConfig,
};
