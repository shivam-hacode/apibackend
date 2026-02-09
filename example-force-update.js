// example-force-update.js
// Example showing how to apply forceUpdateMiddleware globally to all /api routes

const express = require('express');
const app = express();
const forceUpdateMiddleware = require('./src/middleware/forceUpdateMiddleware');

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply force update middleware globally to all routes starting with /api
// This will detect old mobile apps and force them to update
app.use('/api', forceUpdateMiddleware);

// Your API routes (all will be protected by force update check)
app.get('/api/users', (req, res) => {
	res.json({ users: [] });
});

app.post('/api/data', (req, res) => {
	res.json({ success: true });
});

// Routes outside /api are NOT protected (web access)
app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	console.log('Force update middleware active on /api routes');
});

module.exports = app;
