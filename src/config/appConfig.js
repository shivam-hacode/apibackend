// config/appConfig.js
require('dotenv').config();
const AppVersionConfig = require('../models/AppVersionConfig');

/**
 * App Configuration Service
 * Manages app version requirements and update settings
 * Supports configuration from DB with fallback to environment variables
 */
class AppConfigService {
	constructor() {
		// Cache for DB config
		this.configCache = null;
		this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
		this.lastCacheTime = 0;
	}

	/**
	 * Get configuration from DB or env (with caching)
	 * @returns {Promise<Object>} Configuration object
	 */
	async getConfig() {
		const now = Date.now();
		
		// Return cached config if still valid
		if (this.configCache && (now - this.lastCacheTime) < this.cacheExpiry) {
			return this.configCache;
		}

		try {
			// Try to get from DB first
			const dbConfig = await AppVersionConfig.getConfig();
			
			this.configCache = {
				minimumRequiredVersion: dbConfig.minimumRequiredVersion || process.env.MINIMUM_REQUIRED_VERSION || '2.0.0',
				latestVersion: dbConfig.latestVersion || process.env.LATEST_VERSION || '2.0.0',
				otaUrl: dbConfig.otaUrl || process.env.OTA_URL || '',
				forceUpdate: dbConfig.forceUpdate !== undefined ? dbConfig.forceUpdate : (process.env.FORCE_UPDATE !== 'false'),
			};
			
			this.lastCacheTime = now;
			return this.configCache;
		} catch (error) {
			console.error('Error fetching config from DB, using env fallback:', error);
			
			// Fallback to environment variables
			this.configCache = {
				minimumRequiredVersion: process.env.MINIMUM_REQUIRED_VERSION || '2.0.0',
				latestVersion: process.env.LATEST_VERSION || '2.0.0',
				otaUrl: process.env.OTA_URL || '',
				forceUpdate: process.env.FORCE_UPDATE !== 'false',
			};
			
			this.lastCacheTime = now;
			return this.configCache;
		}
	}

	/**
	 * Get app configuration for clients
	 * @returns {Promise<Object>} App configuration object
	 */
	async getAppConfig() {
		const config = await this.getConfig();
		return {
			version: config.latestVersion,
			minimumRequiredVersion: config.minimumRequiredVersion,
			otaUrl: config.otaUrl,
			forceUpdate: config.forceUpdate,
		};
	}

	/**
	 * Get the required version (async)
	 * @returns {Promise<string>} Required version
	 */
	async getRequiredVersion() {
		const config = await this.getConfig();
		return config.minimumRequiredVersion;
	}

	/**
	 * Get OTA URL
	 * @returns {Promise<string>} OTA URL
	 */
	async getOtaUrl() {
		const config = await this.getConfig();
		return config.otaUrl;
	}

	/**
	 * Invalidate cache (useful after updating config in DB)
	 */
	invalidateCache() {
		this.configCache = null;
		this.lastCacheTime = 0;
	}
}

// Export singleton instance
module.exports = new AppConfigService();
