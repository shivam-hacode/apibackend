const cron = require('node-cron');
const { autoSubmitResult } = require('./autoSubmit');

function scheduleJobOnQuarter(taskFunction) {
	const now = new Date();
	const minutes = now.getMinutes();
	const seconds = now.getSeconds();
	const ms = now.getMilliseconds();

	// Minutes remaining until next quarter (15, 30, 45, 60)
	const remainder = minutes % 15;
	const delayMinutes = remainder === 0 ? 15 : 15 - remainder;

	const delayMs =
		delayMinutes * 60 * 1000 -
		(seconds * 1000 + ms);

	const nextRunTime = new Date(now.getTime() + delayMs);

	console.log(
		`Scheduler will start at ${nextRunTime.toLocaleTimeString()}`
	);

	setTimeout(async () => {
		// Run once exactly at the quarter
		await taskFunction();

		// Then keep running every 15 minutes aligned to quarters
		cron.schedule('*/15 * * * *', async () => {
			await taskFunction();
		});
	}, delayMs);
}

scheduleJobOnQuarter(autoSubmitResult);
