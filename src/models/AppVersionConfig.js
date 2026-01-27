const mongoose = require('mongoose');

const appVersionConfigSchema = new mongoose.Schema(
	{
		minimumRequiredVersion: {
			type: String,
			required: true,
			default: '2.0.0',
		},
		latestVersion: {
			type: String,
			required: true,
			default: '2.0.0',
		},
		otaUrl: {
			type: String,
			required: false,
		},
		forceUpdate: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	}
);

// Ensure only one document exists
appVersionConfigSchema.statics.getConfig = async function () {
	let config = await this.findOne();
	if (!config) {
		config = await this.create({
			minimumRequiredVersion: process.env.MINIMUM_REQUIRED_VERSION || '2.0.0',
			latestVersion: process.env.LATEST_VERSION || '2.0.0',
			otaUrl: process.env.OTA_URL || '',
			forceUpdate: process.env.FORCE_UPDATE !== 'false',
		});
	}
	return config;
};

const AppVersionConfig = mongoose.model('AppVersionConfig', appVersionConfigSchema);

module.exports = AppVersionConfig;
