const axios = require('axios');
const moment = require('moment-timezone');
const HOST = "http://localhost:5000/api"; // Replace with your backend API base URL
//const HOST = 'https://13.61.215.183/api'; // Replace with your backend API base URL

async function autoSubmitResult() {
	try {
		// Calculate next quarter hour times
		const now = moment();
		const rounded = now
			.clone()
			.startOf('minute')
			.add(15 - (now.minute() % 15), 'minutes');

		// Generate random number string
		const randomNum = Math.floor(Math.random() * 99) + 1;
		const formattedNumber = randomNum.toString().padStart(2, '0');

		const currentTime = moment().tz('Asia/Kolkata').startOf('minute');

		// Get next quarter hour
		const nextQuarter = moment(currentTime).add(
			15 - (currentTime.minute() % 15),
			'minutes'
		);

		// Get the quarter after that
		const nextNextQuarter = moment(nextQuarter).add(15, 'minutes');

		// Format both
		const formattedNextNext = nextNextQuarter.format('MMMM Do YYYY, h:mm a');

		console.log('formattedqua:', formattedNextNext);

		const noww = moment(); // get current time
		const roundedd = moment(noww)
			.add(15 - (noww.minute() % 15), 'minutes')
			.startOf('minute');

		console.log('Current Time:', noww.format('HH:mm'));

		console.log('Rounded Time:', rounded.format('HH:mm'));

		console.log('Next quarter hour:', roundedd.format('h:mm a'));

		const postData = {
			categoryname: 'Minidiswar',
			time: noww.format('HH:mm'), // only 12-hour time format
			number: formattedNumber,
			next_result: roundedd.format('h:mm a'),
			result: [
				{
					time: noww.format('HH:mm'),
					number: formattedNumber,
				},
			],
			date: moment().format('YYYY-MM-DD'),
			key: 'md-9281',
			mode: 'auto',
		};

		// // Post the result
		const resultRes = await axios.post(
			`${HOST}/result-with-authcode`,
			postData,
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);

		console.log('Result submitted successfully:', resultRes.data);
		return resultRes.data;
	} catch (error) {
		console.error('Error in autoSubmitResult:', error.message);
		throw error;
	}
}

module.exports = { autoSubmitResult };
