const querystring = require('querystring');
const moment = require('moment-timezone');
const request = require('request-promise-native');

const config = require('../config');
const MongoDBService = require('./db-service');

const { baseUrl, path, query, imageBaseUrl, imagePostfix } = config.scraper.realestate;

let retryTimes = 0;

const run = (i, nextUrl, cb) => {
	if(!cb) {
		cb = nextUrl;
		const queryObj = JSON.parse(JSON.stringify(query))
		queryObj['page[offset]'] = i * 80;
		nextUrl = baseUrl + path + '?' + querystring.stringify(queryObj);
	}
	try {
		console.log(`realestate: page ${i+1} started`);
		request(nextUrl)
			.then(async (body) => {
				console.log(`realestate: Got page ${i+1}`);
				let completed = false;
				body = JSON.parse(body);
				const dataList = [];
				body.data.forEach(item => {
					const displayPrice = Number(item.attributes['price-display'].replace(config.regexCurrencyToNumber, ''));
					if (!displayPrice) {
						return;
					}
					const attr = item.attributes;
					const rel = item.relationships;
					const date = new Date(attr['created-date']); // published-date
					date.setHours(0, 0, 0, 0);
					const dayBeforYesterday = new Date();
					dayBeforYesterday.setDate(dayBeforYesterday.getDate()-2);
					dayBeforYesterday.setHours(0, 0, 0, 0);
					if(date<=dayBeforYesterday) {
						completed = true;
					} else {
						const data = {
							site: 'realestate',
							date,
							id: item.id, // attr['listing-no'],
							title: attr.header,
							bedrooms: attr['bathroom-count'],
							bathrooms: attr['bedroom-count'],
							address: attr.address && `${attr.address['street-number']} ${attr.address['street-name']} ${attr.address['suburb']}`,
							price: attr.price
						}
						if (rel && rel.offices && rel.offices.data && rel.offices.data.length > 0) {
							const includedObj = body.included.find(obj => (obj.id === rel.offices.data[0].id && obj.type === rel.offices.data[0].type))
							if (includedObj && includedObj.attributes && includedObj.attributes.image) {
								const img = includedObj.attributes.image['base-url']
								data.company = img && imageBaseUrl + img + imagePostfix;
							} else if (includedObj && includedObj.attributes && includedObj.attributes.images && includedObj.attributes.images.length > 0) {
								const img = includedObj.attributes.images[0]['base-url']
								data.company = img && imageBaseUrl + img + imagePostfix;
							}
						}
						dataList.push(data);
					}
				});
				console.log(`realestate: total filter properties for page ${i+1} is ${dataList.length}`);
				if(dataList && dataList.length) {
					const mongoDBService = new MongoDBService();
					await mongoDBService.insertIntoProperty(dataList);
					mongoDBService.close();
				}
				retryTimes = 0;
				if (completed) {
					cb();
				} else {
					run(i + 1, cb);
				}
			}).catch(err => {
				console.log(`realestate: page ${i+1} error1 `, err);
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
		console.log(`realestate: page ${i+1} error2 `, e);
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