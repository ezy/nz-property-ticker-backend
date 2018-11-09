const MongoClient = require('mongodb').MongoClient;
const config = require('../config');

class MongoDBService {

    constructor() {
        this.db = null;
        this.client = null;
        this.propertyCollection = 'properties';
    }

    async connect() {
        this.client = new MongoClient(config.db.MONGO_URI, config.db.options);
        await this.client.connect();
        this.db = this.client.db(config.db.MONGO_DB_NAME);
        return this.db;
    }

    async insertIntoProperty(data) {
        if (!this.db) {
            await this.connect();
        }
        const collection = this.db.collection(this.propertyCollection);
        try {
            await collection.insertMany(data);
        } catch (error) {
            if (error.code == 11000) {
                for (let i = 0; i < data.length; i++) {
                    try {
                        await collection.insertOne(data[i]);
                    } catch (error1) {
                        if (error1.code == 11000) {
                            break;
                        } else {
                            throw error1;
                        }
                    }
                }
            } else {
                throw error;
            }
        }
    }

    async findProperty(query, options) {
        if (!this.db) {
            await this.connect();
        }
        const collection = this.db.collection(this.propertyCollection);
        return collection.find(query, options).toArray();
    }

    async close() {
        this.client.close();
    }
}

module.exports = MongoDBService;