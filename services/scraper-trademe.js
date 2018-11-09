const querystring = require('querystring');
const moment = require('moment-timezone');
const request = require('request-promise-native');
const cheerio = require('cheerio');

const config = require('../config');
const MongoDBService = require('./db-service');

const { baseUrl, path, query } = config.scraper.trademe;

let retryTimes = 0;

//db.property.createIndex( { site: 1, id: 1}, { unique: true } )

const run = (i, nextUrl, cb) => {
	if(!cb) {
		cb = nextUrl;
		nextUrl = baseUrl + path + '?' + querystring.stringify(query);
	}
	try {
		console.log(`trademe: page ${i+1} started`);
		request(nextUrl)
			.then(async (body) => {
				let completed = false;
				console.log(`trademe: Got page ${i+1}`);
				const $ = cheerio.load(body);
				const dataList = [];
				$('#ListViewList').find('li:not(.native-ad)').map( function() {
					if(completed) return;
					const ele = $(this);
					const attributes = ele.find('.tmp-search-card-list-view__attributes, .tmp-search-card-top-tier__attributes').children('div');
					const item = {
						site: 'trademe',
						id: ele.find('a').attr('id').replace('property-', ''),
						date: ele.find('span.tmp-search-card-list-view__listed-message, span.tmp-search-card-top-tier__listed-message').text() || ele.find('span.tmp-search-card-list-view__listed-date, span.tmp-search-card-top-tier__listed-date').text(), //['Listed Yesterday', 'Listed Today']
						title: ele.find('.tmp-search-card-list-view__title, .tmp-search-card-top-tier__title').text(),
						address: ele.find('.tmp-search-card-list-view__subtitle, .tmp-search-card-top-tier__subtitle').text(),
						price: ele.find('.tmp-search-card-list-view__price, .tmp-search-card-top-tier__price').text().trim(), // rejex to format in a number /^\$|,/g
						bedrooms: attributes.find('img[alt=bedrooms]').siblings('span').text().trim(),
						bathrooms: attributes.find('img[alt=bathrooms]').siblings('span').text().trim(),
						company: ele.find('.tmp-search-card-list-view__agent-logo, .tmp-search-card-top-tier__agent-profile-image').attr('src') || ele.find('.tmp-search-card-top-tier__branding-group--agent-logo, img.tmp-search-card-top-tier__agent-branding-banner-image').attr('src') || ele.find('span.tmp-search-card-list-view__branding-message').text()
					}
					if(!(item.date === 'Listed Today' || item.date === 'Listed Yesterday')) {
						completed = true;
					} else {
						item.price =  Number(item.price.replace(config.regexCurrencyToNumber, ''));
						const date = moment().startOf('day');
						if(item.date === 'Listed Yesterday') {
							date.subtract(1, 'day');
						}
						item.date = date.toDate();
						if(item.price) {
							dataList.push(item);
						}
					}
				})
				const nextUrl = baseUrl + $('#PagingFooter').find('a[rel=next]').attr('href');
				console.log(`trademe: total filter properties for page ${i+1} is ${dataList.length}`);
				if(dataList && dataList.length) {
					const mongoDBService = new MongoDBService();
					await mongoDBService.insertIntoProperty(dataList);
					mongoDBService.close();
				}
				retryTimes = 0;
				if (completed) {
					cb();
				} else {
					run(i + 1, nextUrl, cb);
				}
			}).catch(err => {
				console.log(`trademe: page ${i+1} error1 `, err);
				if(retryTimes<3) {
					retryTimes++;
					setTimeout( () => {
						run(i, cb);
					}, 10000);
				} else {
					cb(err);
				}
			});
	} catch (e) {
		console.log(`trademe: page ${i+1} error2 `, err);
		if(retryTimes<3) {
			retryTimes++;
			setTimeout( () => {
				run(i, cb);
			}, 10000);
		} else {
			cb(e);
		}
	}
}

module.exports = run