const express = require('express');
const moment = require('moment');

const config = require('./config');
const jobScheduler = require('./services/job-scheduler');
const MongoService = require('./services/db-service');

const app = express();

app.get('/api/v1/nz', async (req, res, next) => {
    const startDate = moment(req.query.start).startOf('day');
    const endDate = moment(req.query.end).startOf('day');
    console.info('api: start date: ', startDate.format('DD-MM-YYYY hh:mm:ss'));
    console.info('api: end date:   ', endDate.format('DD-MM-YYYY hh:mm:ss'));
    if (startDate.isValid() && endDate.isValid()) {
       try {
        const query = {
            date: {
                $gte: startDate.toDate(),
                $lte: endDate.toDate()
            }
        }
        const mongoService = new MongoService();
        const data = await mongoService.findProperty(query);
        mongoService.close();
        res.json({message: 'Property fetch successfully!', data});
       } catch (error) {
           console.log('api: error', error);
           next(error)
       }
    } else {
        const error = new Error('Invalid start or end date provided');
        error.status = 400;
        next(error);
    }
});


// not found
app.use(function (req, res, next) {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

// error handler
app.use(function (err, req, res) {
    res.status(err.status || 500);
    const resultData = {
        message: err.message
    }
    if (config.environment === 'development') {
        resultData.error = err;
    }
    res.json(resultData);
});

app.listen(config.port, () => {
    jobScheduler();
    console.log(`API is running on ${config.host}:${config.port}`);
});