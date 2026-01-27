const mongoose = require('mongoose');

const bcrypt = require('bcrypt');
const CategoryKeyModel = require('../models/KeyModel');
const redis = require('../redisClient');
const ResultsModel = require('../models/ResultModel');
const Result = require('../models/ResultModel');
const Result2 = require('../models/ScrapperResultModel');
const moment = require('moment');
// Safe time formatter to accept multiple frontend formats
function safeFormatTime(rawTime) {
if (!rawTime) return null;
// Accept 24-hour, 12-hour with space, and 12-hour without space (e.g., 07:15PM)
const m = moment(rawTime, ['HH:mm', 'hh:mm A', 'hh:mma'], true);
return m.isValid() ? m.format('hh:mm A') : null;
}

function addUniqueTime(timesArray, time, number) {
if (!time) return;
const exists = timesArray.some((entry) => entry.time === time);
if (!exists) timesArray.push({ time, number });
}

const FetchAllCategoriesWithoutAuthcode = async (req, res) => {
const findAllCategory = await CategoryKeyModel.find({});

    if (findAllCategory.length !== 0) {
    	res.status(200).json({
    		baseResponse: { message: 'Fetch all', status: 1 },
    		data: findAllCategory,
    	});
    } else {
    	res.status(200).json({ baseResponse: { message: 'Fetch all', status: 1 } });
    }

};

const CreateNewResult = async (req, res) => {
try {
const {
categoryname,
date,
number,
next_result,
next_time,
key,
time,
mode,
} = req.body;
console.log('req.body:', req.body);
const formattedDate = moment(date, ['DD/MM/YY', 'YYYY-MM-DD'], true).format(
'YYYY-MM-DD'
);
const formattedTime = safeFormatTime(time);
const formattedNextTime = safeFormatTime(next_time);

    	if (!formattedTime) {
    		return res
    			.status(400)
    			.json({ message: 'Invalid or missing time format' });
    	}

    	const timesToAdd = [];
    	if (formattedTime) timesToAdd.push({ time: formattedTime, number });
    	if (formattedNextTime && next_result)
    		timesToAdd.push({ time: formattedNextTime, number: next_result });

    	let doc = await ResultsModel.findOne({ categoryname });

    	if (doc) {
    		// Find date group
    		let dateGroup = doc.result.find((r) => r.date === formattedDate);

    		// If date group exists, check for duplicate times
    		if (dateGroup) {
    			const duplicateTimes = timesToAdd
    				.filter((t) =>
    					dateGroup.times.some((existing) => existing.time === t.time)
    				)
    				.map((t) => t.time);

    			if (duplicateTimes.length > 0) {
    				return res.status(200).json({
    					message: `Duplicate time(s) detected`,
    				});
    			}

    			// Use $push to add new times to existing date group
    			await ResultsModel.updateOne(
    				{ categoryname, 'result.date': formattedDate },
    				{
    					$push: { 'result.$.times': { $each: timesToAdd } },
    					$set: { next_result },
    				}
    			);
    		} else {
    			// Date group does not exist ? create new date group
    			await ResultsModel.updateOne(
    				{ categoryname },
    				{
    					$push: { result: { date: formattedDate, times: timesToAdd } },
    					$set: { next_result },
    				}
    			);
    		}

    		// Fetch updated document
    		doc = await ResultsModel.findOne({ categoryname });
    	} else {
    		// New document
    		doc = await ResultsModel.create({
    			categoryname,
    			key,
    			mode,
    			number,
    			next_result,
    			result: [{ date: formattedDate, times: timesToAdd }],
    			date,
    		});
    	}

    	// Cache for 2 minutes
    	const cacheKey = `results:${categoryname}:${formattedDate}`;
    	await redis.set(cacheKey, doc, { ex: 50 });

    	return res.status(200).json({
    		message: 'Result saved successfully',
    		data: doc,
    	});
    } catch (error) {
    	console.error('Error in CreateNewResult:', error);
    	return res.status(500).json({
    		message: 'Server error',
    		error: error.message,
    	});
    }

};

const FetchAllResult = async (req, res) => {
try {
const currentTime = moment();
const today = currentTime.format('YYYY-MM-DD');
const currentMoment = moment(currentTime, 'HH:mm A');

    	// ? Query Result collection: fetch only today's entries
    	const latestResult = await Result.find(
    		{ 'result.date': today },
    		{ 'result.$': 1, categoryname: 1, next_result: 1, createdAt: 1 }
    	).sort({ createdAt: -1 });

    	const filteredResults = latestResult.map((doc) => {
    		const entry = doc.result[0]; // only today's due to $ projection
    		const sortedTimes = entry.times.sort(
    			(a, b) => moment(b.time, 'hh:mm A').diff(moment(a.time, 'hh:mm A')) // ?? Descending
    		);

    		return {
    			...doc._doc,
    			result: [{ ...entry._doc, times: sortedTimes }],
    		};
    	});

    	// ? Merge both
    	const combined = [...filteredResults];

    	res.status(200).json({
    		message: 'Results fetched successfully',
    		data: latestResult,
    	});
    } catch (error) {
    	console.error('Error in FetchAllResult:', error);
    	res.status(500).json({
    		message: 'Error fetching results',
    		error: error.message,
    	});
    }

};

const FetchAllResultWithoutAuthcode = async (req, res) => {
try {
const currentTime = moment();
const today = currentTime.format('YYYY-MM-DD');
const currentMonth = currentTime.month();
const currentYear = currentTime.year();

    	const cacheKey = `results:${currentYear}-${currentMonth}`;

    	// ?? Check Redis cache first
    	const cachedData = await redis.get(cacheKey);
    	if (cachedData) {
    		return res.status(200).json({
    			message: 'Results fetched successfully (from cache)',
    			data: cachedData, // ?? Parse back to object
    		});
    	}

    	// ?? Fetch from DB if cache is empty
    	const latestResult = await Result.find({}).sort({ createdAt: -1 }).lean();
    	const latestResult2 = await Result2.find({}).sort({ createdAt: -1 }).lean();

    	const isCurrentMonth = (dateStr) => {
    		const entryDate = moment(dateStr, 'YYYY-MM-DD');
    		return (
    			entryDate.month() === currentMonth && entryDate.year() === currentYear
    		);
    	};
    	const filteredResults = latestResult.map((doc) => {
    		const filteredResult = doc.result
    			.filter((entry) => isCurrentMonth(entry.date))
    			.map((entry) => {
    				if (entry.date === today) {
    					// ? Sort times in ascending order
    					const sortedTimes = entry.times
    						.filter((t) =>
    							moment(t.time, 'hh:mm A').isSameOrBefore(currentTime)
    						)
    						.sort((a, b) =>
    							moment(a.time, 'hh:mm A').diff(moment(b.time, 'hh:mm A'))
    						);

    					return { ...entry, times: sortedTimes };
    				}
    				return entry;
    			});

    		return { ...doc, result: filteredResult };
    	});

    	const filteredResults2 = latestResult2.map((doc) => {
    		const filteredResult = doc.result
    			.filter((entry) => isCurrentMonth(entry.date))
    			.filter((entry) =>
    				moment(entry.time, 'hh:mm A').isSameOrBefore(currentTime)
    			);

    		return { ...doc, result: filteredResult };
    	});

    	const combined = [...filteredResults, ...filteredResults2];

    	// ?? Store in Redis cache (stringify + set expiry 2 min)
    	await redis.set(cacheKey, combined, { ex: 50 });

    	res.status(200).json({
    		message: 'Results fetched successfully (current month only)',
    		data: combined,
    	});
    } catch (error) {
    	res.status(500).json({
    		message: 'Error fetching results',
    		error: error.message,
    	});
    }

};
// ===================== UPDATE RESULT =====================
const UpdateResult = async (req, res) => {
try {
const { _id } = req.params;
const { date, time, number, next_result } = req.body;

    	const collection = mongoose.connection.db.collection('results');

    	const updated = await collection.updateOne(
    		{ _id: new mongoose.Types.ObjectId(_id) },
    		{
    			$set: {
    				'result.$[d].times.$[t].number': number,
    				next_result,
    			},
    		},
    		{
    			arrayFilters: [{ 'd.date': date }, { 't.time': time }],
    		}
    	);

    	if (updated.matchedCount === 0) {
    		return res
    			.status(200)
    			.json({ message: 'No matching date/time entry found' });
    	}

    	await redis.del('results:*');

    	res.status(200).json({
    		message: 'Result updated successfully',
    		data: updated,
    	});
    } catch (err) {
    	res
    		.status(500)
    		.json({ message: 'Internal Server Error', error: err.message });
    }

};

// ===================== ADD KEY =====================
const AddKeyForResultUpdation = async (req, res) => {
const { key, categoryname } = req.body;

    const keyExists = await CategoryKeyModel.findOne({ key });
    if (!keyExists) {
    	const nameExists = await CategoryKeyModel.findOne({ categoryname });
    	if (!nameExists) {
    		const saved = await new CategoryKeyModel({ key, categoryname }).save();
    		await redis.del('categories:all');
    		return res.status(200).json({
    			baseResponse: { message: 'Key Added successfully', status: 1 },
    			response: saved,
    		});
    	}
    }

    res.status(200).json({
    	baseResponse: { message: 'Key or Category already exists', status: 0 },
    });

};

// ===================== FETCH ALL CATEGORIES =====================
const FetchAllCategories = async (req, res) => {
const cacheKey = 'categories:all';
const cached = await redis.get(cacheKey);

    if (cached) return res.status(200).json(JSON.parse(cached));

    const data = await CategoryKeyModel.find({});
    const response = { baseResponse: { message: 'Fetch all', status: 1 }, data };

    await redis.set(cacheKey, JSON.stringify(response), { ex: 50 });
    res.status(200).json(response);

};

// ===================== GET RESULTS WITH DATE =====================
const GetResultsWithDate = async (req, res) => {
const { date, categoryname, mode } = req.params;
const cacheKey = `results:date:${categoryname}:${date}:${mode}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.status(200).json(JSON.parse(cached));

    let response;

    if (mode === 'scraper') {
    	const d1 = await ResultsModel.find({ date, categoryname });
    	const d2 = await Result2.find({ date, categoryname });
    	response = {
    		baseResponse: { message: 'Fetch all', status: 1 },
    		data: [...d1, ...d2],
    	};
    } else {
    	const data = await ResultsModel.find({ categoryname });
    	response = { baseResponse: { message: 'Fetch all', status: 1 }, data };
    }

    await redis.set(cacheKey, JSON.stringify(response), { ex: 50 });
    res.status(200).json(response);

};

// ===================== FETCH RESULTS BY MONTH =====================
const FetchResultsByMonth = async (req, res) => {
const { selectedDate, categoryname, mode } = req.params;
const cacheKey = `resultsByMonth:${categoryname}:${selectedDate}:${mode}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
    	try {
    		return res.status(200).json(JSON.parse(cached));
    	} catch {
    		await redis.del(cacheKey);
    	}
    }

    const selectedMoment = moment(selectedDate, 'YYYY-MM-DD', true);
    const startDate = moment([selectedMoment.year(), selectedMoment.month(), 1]);
    const endDate = selectedMoment;

    let responsePayload;

    if (mode === 'scraper') {
    	const results2 = await Result2.find({ categoryname });
    	responsePayload = {
    		baseResponse: { message: 'Results fetched successfully', status: 1 },
    		from: startDate.format('YYYY-MM-DD'),
    		to: endDate.format('YYYY-MM-DD'),
    		data: results2,
    	};
    } else {
    	const results = await ResultsModel.find({ categoryname });
    	responsePayload = {
    		baseResponse: { message: 'Results fetched successfully', status: 1 },
    		from: startDate.format('YYYY-MM-DD'),
    		to: endDate.format('YYYY-MM-DD'),
    		data: results,
    	};
    }

    await redis.set(cacheKey, JSON.stringify(responsePayload), { EX: 50 });
    return res.status(200).json(responsePayload);

};
// ===================== GET RESULT BY ID =====================
const getresultbyId = async (req, res) => {
const { id } = req.params;
if (!mongoose.Types.ObjectId.isValid(id)) {
return res.status(400).json({
baseResponse: { message: 'INVALID_ID', status: 0 },
response: [],
});
}

    const cacheKey = `result:id:${id}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.status(200).json(JSON.parse(cached));

    const result = await Result.findById(id);
    if (!result) {
    	return res.status(404).json({
    		baseResponse: { message: 'NOT_FOUND', status: 0 },
    		response: [],
    	});
    }

    const response = {
    	baseResponse: { message: 'STATUS_OK', status: 1 },
    	response: result,
    };
    await redis.set(cacheKey, JSON.stringify(response), { ex: 50 });
    res.status(200).json(response);

};

// ===================== DELETE TIME ENTRY =====================
const deleteTimeEntry = async (req, res) => {
try {
const { id } = req.params;
const { date, time } = req.body;

    	const updated = await ResultsModel.findOneAndUpdate(
    		{ _id: id },
    		{ $pull: { 'result.$[d].times': { time } } },
    		{ new: true, arrayFilters: [{ 'd.date': date }] }
    	);

    	if (!updated)
    		return res.status(404).json({ message: 'No matching entry found' });

    	await redis.del('results:*');

    	res.json({ message: 'Time entry deleted successfully', updated });
    } catch (err) {
    	res.status(500).json({ message: 'Error deleting time entry' });
    }

};

// ===================== FETCH ALL RESULTS =====================
const fetchAllFuckingResult = async (req, res) => {
const cacheKey = 'results:all';
const cached = await redis.get(cacheKey);

    if (cached) return res.status(200).json(JSON.parse(cached));

    const data = await ResultsModel.find();
    const response = { response: data };

    await redis.set(cacheKey, JSON.stringify(response), { ex: 50 });
    res.status(200).json(response);

};

module.exports = {
CreateNewResult,
FetchAllResult,
UpdateResult,
AddKeyForResultUpdation,
FetchAllCategories,
GetResultsWithDate,
FetchAllCategoriesWithoutAuthcode,
FetchAllResultWithoutAuthcode,
FetchResultsByMonth,
getresultbyId,
deleteTimeEntry,
fetchAllFuckingResult,
};
