// example-app.js
// Example showing how to apply versionCheckMiddleware globally to all /api routes

const express = require('express');
const app = express();
const versionCheckMiddleware = require('./src/middleware/versionCheckMiddleware');

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply version check middleware globally to all routes starting with /api
app.use('/api', versionCheckMiddleware);

// Your API routes (all will be protected by version check)
app.get('/api/users', (req, res) => {
	res.json({ users: [] });
});

app.post('/api/data', (req, res) => {
	res.json({ success: true });
});

// Routes outside /api are NOT protected
app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

module.exports = app;
