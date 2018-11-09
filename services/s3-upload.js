const { Readable, Writable } = require('stream');

const moment = require('moment');
const csv = require('fast-csv');
const AWS = require('aws-sdk');

const config = require('../config');
const MongoService = require('./db-service');

AWS.config.credentials = new AWS.Credentials(config.aws);
const s3 = new AWS.S3(config.aws.s3);

module.exports = () => {
    return new Promise(async (resolve, reject) => {
        try {
            // preparing query and required fields for db
            const queryDate = moment().subtract(1, 'day').startOf('day');
            const query = {
                date: queryDate.toDate()
            }
            const options = {
                projection: {
                    _id: 0,
                    site: 0
                }
            }
            const mongoService = new MongoService();
            const data = await mongoService.findProperty(query, options);
            mongoService.close();

            // converting data into csv stream 
            const csvStream = csv.createWriteStream({headers: true});
            const writableStream = new Writable();
            const readableStream = new Readable();

            readableStream._read = () => {};
            writableStream._write = (chunk, encoding, done) => readableStream.push(chunk, encoding) && done();
            writableStream.on('finish', () => readableStream.push(null));
            csvStream.pipe(writableStream);

            for(let i = 0; i<data.length; i++) {
                data[i].date = data[i].date.toLocaleDateString();
                data[i].title.replace(', ', ' ');
                data[i].title.replace(',', ' ');
                data[i].address.replace(', ', ' ');
                data[i].address.replace(',', ' ');
                csvStream.write(data[i]);
            }
            csvStream.end();
            const params = {
                Key: queryDate.format('YYYY-MM-DD') + '.csv',
                Body: readableStream
            };
            s3.upload(params, err => err ? reject(err) : resolve());
        } catch (err) {
            return reject(err);
        }
    });
}
