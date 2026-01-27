// router/appConfigRouter.js
const express = require('express');
const { getAppConfig, getVersionConfig, getOtaManifest } = require('../controller/AppConfigController');

const router = express.Router();

// GET /api/app-config
// This endpoint should NOT require version check so clients can check requirements
router.get('/app-config', getAppConfig);

// Separate router for root-level routes
const rootRouter = express.Router();

// GET /app/version-config
// Returns version + otaUrl
rootRouter.get('/app/version-config', getVersionConfig);

// GET /ota/ota-manifest.json
// Returns OTA manifest file
rootRouter.get('/ota/ota-manifest.json', getOtaManifest);

module.exports = router;
module.exports.rootRouter = rootRouter;