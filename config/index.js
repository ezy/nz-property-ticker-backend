module.exports = {
	port: process.env.PORT || 3000,
	host: process.env.HOST || 'localhost',
	environment: process.env.NODE_ENV || 'development',
	db: {
		MONGO_URI: process.env.MONGO_URI || 'mongodb://<user>:<pass>@ds121593.mlab.com:21593/<db>',
		MONGO_DB_NAME: process.env.MONGO_DB_NAME || 'nzproperty',
		options: {
			useNewUrlParser: true
		}
	},
	mail: {
		smtp: {
			host: 'smtp.sendgrid.net',
			port: 465,
			secure: true, // true for 465, false for other ports
			auth: {
				user: 'apikey',
				pass: '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'
			}
		},
		emailFrom: 'email@fastmail.com',
		emailOnError: 'email@fastmail.com',
		subjectForError: 'Error in nzproperty-scrape'
	},
	aws: {
		accessKeyId: 'AKIAIPXAGHLZ5YB3WATA',
		secretAccessKey: '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',
		s3: {
			apiVersion: '2006-03-01',
			params: {
			  Bucket: 'nzproperty-testing'
			}
		  }
	},
	scraper: {
		realestate: {
			imageBaseUrl: 'http://mediaserver.realestate.co.nz',
			imagePostfix: '.pad-ffffff.72x24.jpg',
			baseUrl: 'https://platform.realestate.co.nz',
			path: '/search/v1/listings',
			query: {
				'filter[category][0]': 'res_sale',
				'page[groupBy]': 'latest',
				'page[limit]': 80,
				'page[offset]': 0
			}
		},
		trademe: {
			baseUrl: 'https://www.trademe.co.nz',
			path: '/browse/categoryattributesearchresults.aspx',
			query: {
				'29': '',
				'49': '0,0',
				'122': '0,0',
				'123': '0,0',
				'132': 'PROPERTY',
				'136': '',
				'153': '',
				'216': '0,0',
				'217': '0,0',
				'sort_order': 'expiry_desc',
				'search': 1,
				'sidebar': 1,
				'cid': 5748,
				'rptpath': '350-5748-',
				'rsqid': 'bca41be87234484b93b1b0cb6ac3a319'
			}
		}
	},
	regexCurrencyToNumber: /^\$|,/g
}
