const express = require('express');
const app = express();
const redis = require('./src/redisClient.js'); //const router = require("./src/router/resultRoutes.js");
const cors = require('cors');
const router = require('./src/router/resultRoutes.js');

const loginrouter = require('./src/router/authRouter.js');
const Result2 = require('./src/models/ScrapperResultModel.js');
require('./src/config/dbconnect.js');
require('./src/scheduler.js');
// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api', router);
app.use('/api', loginrouter);

// Sample route
app.get('/api/hello', (req, res) => {
	res.json({ message: 'Hello from Vercel Serverless!' });
});

app.post('/api/upload-data', async (req, res) => {
	try {
		const { categoryname, date, time, result, number, next_result, mode } =
			req.body;

		if (!categoryname || !date || !time || !result || !number || !next_result) {
			return res.status(400).json({ message: 'Missing required fields.' });
		}

		// Format date & time
		const formattedDate = moment(date, ['DD/MM/YY', 'YYYY-MM-DD']).format(
			'YYYY-MM-DD'
		);
		const formattedTime = moment(time, ['HH:mm', 'hh:mm A']).format('hh:mm A');

		// Redis cache key
		const cacheKey = `results:${categoryname}:${formattedDate}`;

		// Check if document with the categoryname exists
		let existingDoc = await Result2.findOne({
			categoryname: { $regex: new RegExp(`^${categoryname}$`, 'i') },
		});

		if (!existingDoc) {
			// Create new document
			const newDoc = new Result2({
				categoryname,
				date: formattedDate,
				result: [{ date: formattedDate, time: formattedTime, number }],
				number,
				next_result: formattedTime,
				mode,
			});

			await newDoc.save();

			// ? Update Redis cache
			await redis.set(cacheKey, newDoc, { ex: 120 });

			return res.status(201).json({
				message: 'New category created and result added.',
				data: newDoc,
			});
		}

		// Check if result for the same date and time already exists
		const existingIndex = existingDoc.result.findIndex(
			(entry) => entry.date === formattedDate && entry.time === formattedTime
		);

		if (existingIndex !== -1) {
			// Update the existing result's number
			existingDoc.result[existingIndex].number = number;
		} else {
			// Add new result to the existing document
			existingDoc.result.push({
				date: formattedDate,
				time: formattedTime,
				number,
			});
		}

		// Update other fields
		existingDoc.number = number;
		existingDoc.next_result = formattedTime;
		existingDoc.mode = mode;
		existingDoc.date = formattedDate;

		await existingDoc.save();

		// ? Update Redis cache
		await redis.set(cacheKey, existingDoc, { ex: 120 });

		return res.status(200).json({
			message:
				existingIndex !== -1
					? 'Existing result updated.'
					: 'New result added to existing category.',
			data: existingDoc,
		});
	} catch (error) {
		console.error('Upload error:', error);
		res.status(500).json({
			message: 'Internal server error',
			error: error.message,
		});
	}
});	

app.listen(5000);

module.exports = app;
