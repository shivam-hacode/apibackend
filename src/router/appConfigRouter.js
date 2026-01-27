// router/appConfigRouter.js
const express = require('express');
const { getAppConfig } = require('../controller/AppConfigController');

const router = express.Router();

// GET /api/app-config
// This endpoint should NOT require version check so clients can check requirements
router.get('/app-config', getAppConfig);

module.exports = router;
