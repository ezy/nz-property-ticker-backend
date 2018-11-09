# Property scraper

Use the checklist below for development. Once a feature is completed you can mark it done, or I will mark it done once I've checked the code and run it locally.

- [x] Completed item

## Tasks

1) A cron job runs daily to scrape property data from 2 web urls

- [ ] The URLs will include pages of content that will need to be clicked through on the scrape
- [ ] Likely records returned for each scrape are < 1000
- [ ] The application schedules the cron job to run at a random time between 7AM - 9AM (GMT+12)
- [ ] It scrapes real estate listings matching yesterdays date (it should return a full 24 hours of listings)
- [ ] If the scrape fails, it should send an email to an admin address
- [ ] If the scrape fails it should recursively reschedule the cron to run in an hours time until it succeeds
- [ ] If the scrape succeeds, the days data should be checked for duplicates using the address field, and saved as YYYY-MM-DD to a csv file for that days data (eg. `2018-12-23.csv`)  and uploaded to an AWS S3 bucket (which I will provide)
- [ ] If the scrape succeeds, the app should calculate the low price, high price, upper quartile, lower quartile, from any scraped listings that have an asking price
- [ ] The app should save the data along with a date field to a mongoDB database hosted on MLab (which I will provide)

2) An API endpoint to serve the MLab data

- [ ] I need a single endpoint that serves the data from MLab at `api/v1/nz`
- [ ] I need to be able to query the data at this endpoint with a date range and return the correct values in the date range like so `api/v1/nz?start=2018-01-01&end=2018-01-31`


## Things required for this project

mongoDB - `mongodb://<user>:<pass>@ds121593.mlab.com:21593/<db>`

S3 Bucket - https://s3.console.aws.amazon.com/s3/buckets/nzproperty/?region=us-west-2 (currently public read and write)

admin email for failure - `email@fastmail.com`

## CSV columns

* date - DATE
* id - STRING
* title - STRING
* bedrooms - INTEGER
* bathrooms - INTEGER
* address - STRING
* company - STRING
* price - INTEGER

## Real estate scraping requirements

* URL to scrape https://www.realestate.co.nz/residential/sale?by=latest&ql=80&qo=80
* company - copy full href link from `agency-logo-tile ember-view` class

![Real estate layout](https://gitlab.com/pfrt/nzproperty-scrape/raw/master/images/Where%20people%20and%20property%20click%20in%20New%20Zealand%20%20%20realestate%20co%20nz.png)

## Trademe scraping requirements

* URL to scrape https://www.trademe.co.nz/browse/categoryattributesearchresults.aspx?sort_order=expiry_desc&136=&153=&132=PROPERTY&122=0%2C0&49=0%2C0&29=&123=0%2C0&search=1&sidebar=1&cid=5748&rptpath=350-5748-&216=0%2C0&217=0%2C0&rsqid=bca41be87234484b93b1b0cb6ac3a319
* id - Copy from tmp-search-card-list-view__link eg. <a id="property-1791765878" class="tmp-search-card-list-view__link"> ("id": "property-1791765878")
* company - use full src url in `tmp-search-card-list-view__agent-logo` class

![Trademe layout](https://gitlab.com/pfrt/nzproperty-scrape/raw/master/images/Property%20search%20results%20%20%20Find%20real%20estate%20on%20Trade%20Me%20Property.png)
