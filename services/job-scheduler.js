const Agenda = require('agenda');
const moment = require('moment');

const config = require('../config');
const mailer = require('./mailer');
const uploadToS3 = require('./s3-upload');
const scraperRealestate = require('./scraper-realestate');
const scraperTrademe = require('./scraper-trademe');

const agenda = new Agenda({
	db: {
		address: config.db.MONGO_URI
	}
});

agenda.define('uploadToS3', (job, done) => {
	uploadToS3().then(done).catch(done);
});
agenda.define('realestate', (job, done) => {
	scraperRealestate(0, done);
});
agenda.define('trademe', async (job, done) => {
	scraperTrademe(0, done);
});

agenda.define('schedule-scraper', (job, done) => {
	const runAfter = `in ${Math.ceil(Math.random() * 119)} minutes`;
	console.log('schedule-scraper: runAfter ', runAfter);
	agenda.schedule(runAfter, ['realestate', 'trademe']);
	done();
});


const jobSuccessEvent = async currentJob => {
	console.log(`${currentJob.attrs.name} scraping done successfully!`);
	currentJob.attrs.data = {
		completed: true
	}
	await currentJob.save();
	const jobs = await agenda.jobs({name: {$in: ['realestate', 'trademe']}});
	const incomplete = jobs.some(job => job.attrs.data===null);
	if(!incomplete) {
		console.log('both completed');
		agenda.now('uploadToS3');
		// clear scheduled scrapping jobs
		await agenda.cancel({name: {$in: ['realestate', 'trademe']}});
	}
}
const jobFailedEvent = (error, job) => {
	console.log(`Job ${job.attrs.name} failed with error `, error);
	//send error mail
	mailer.sendErrorMail(error, job.attrs.name, moment().format('YYYY-MM-DD hh:mm:ss'));
	//remove last scheduled
	agenda.cancel({name: job.attrs.name});
	//schedule new after 1 hour
	agenda.schedule(`in 1 hours`, job.attrs.name);
}
agenda.on('success:realestate', jobSuccessEvent);
agenda.on('success:trademe', jobSuccessEvent);
agenda.on('fail:realestate', jobFailedEvent);
agenda.on('fail:trademe', jobFailedEvent);
agenda.on('success:uploadToS3', async currentJob => {
	console.log(`${currentJob.attrs.name}: file uploaded successfully!`);
	// clear scheduled uploadToS3 jobs
	await agenda.cancel({name: 'uploadToS3'});
});
agenda.on('fail:uploadToS3', jobFailedEvent);



async function graceful() {
	await agenda.stop();
	process.exit(0);
}
process.on('SIGTERM', graceful);
process.on('SIGINT', graceful);

module.exports = async function () {
	await agenda.start();
	await agenda.every('0 7 * * *', 'schedule-scraper');
	// for testing
	// agenda.schedule('in 2 seconds', ['realestate', 'trademe']);
	// await agenda.now('uploadToS3');
};