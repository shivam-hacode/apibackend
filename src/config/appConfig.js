// config/appConfig.js
require('dotenv').config();

/**
 * App Configuration Service
 * Manages app version requirements and update settings
 */
class AppConfigService {
	constructor() {
		// Get configuration from environment variables with defaults
		this.minimumRequiredVersion =
			process.env.MINIMUM_REQUIRED_VERSION || '2.0.0';
		this.latestVersion = process.env.LATEST_VERSION || '2.0.0';
		// Default to true if not set, only false if explicitly 'false'
		this.forceUpdate = process.env.FORCE_UPDATE !== 'false';
		this.apkUrl = process.env.APK_URL || 'https://mydomain.com/app-v2.apk';
	}

	/**
	 * Get app configuration for clients
	 * @returns {Object} App configuration object
	 */
	getAppConfig() {
		return {
			minimumRequiredVersion: this.minimumRequiredVersion,
			latestVersion: this.latestVersion,
			forceUpdate: this.forceUpdate,
			apkUrl: this.apkUrl,
		};
	}

	/**
	 * Check if provided version meets the minimum requirement
	 * @param {string} version - Version to check (e.g., "2.0.0")
	 * @returns {boolean} True if version is acceptable
	 */
	isVersionAllowed(version) {
		if (!version) {
			return false;
		}

		// Normalize version strings for comparison
		const normalizeVersion = (v) => {
			return v
				.split('.')
				.map((num) => parseInt(num, 10) || 0)
				.join('.');
		};

		const normalizedRequired = normalizeVersion(this.minimumRequiredVersion);
		const normalizedProvided = normalizeVersion(version);

		// Compare version strings (semantic versioning)
		return this.compareVersions(normalizedProvided, normalizedRequired) >= 0;
	}

	/**
	 * Compare two version strings
	 * @param {string} version1 - First version
	 * @param {string} version2 - Second version
	 * @returns {number} -1 if version1 < version2, 0 if equal, 1 if version1 > version2
	 */
	compareVersions(version1, version2) {
		const v1Parts = version1.split('.').map(Number);
		const v2Parts = version2.split('.').map(Number);
		const maxLength = Math.max(v1Parts.length, v2Parts.length);

		for (let i = 0; i < maxLength; i++) {
			const v1Part = v1Parts[i] || 0;
			const v2Part = v2Parts[i] || 0;

			if (v1Part < v2Part) return -1;
			if (v1Part > v2Part) return 1;
		}

		return 0;
	}

	/**
	 * Get the required version
	 * @returns {string} Required version
	 */
	getRequiredVersion() {
		return this.minimumRequiredVersion;
	}
}

// Export singleton instance
module.exports = new AppConfigService();
