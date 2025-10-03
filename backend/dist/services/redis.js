"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const redis_1 = require("redis");
const logger_1 = require("@/utils/logger");
class RedisService {
    static client;
    static isConnected = false;
    static async initialize() {
        try {
            this.client = (0, redis_1.createClient)({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            logger_1.logger.error('Redis connection failed after 10 retries');
                            return new Error('Redis connection failed');
                        }
                        return Math.min(retries * 100, 3000);
                    },
                },
            });
            this.client.on('error', (err) => {
                logger_1.logger.error('Redis Client Error:', err);
            });
            this.client.on('connect', () => {
                logger_1.logger.info('Redis client connected');
            });
            this.client.on('ready', () => {
                logger_1.logger.info('Redis client ready');
                this.isConnected = true;
            });
            this.client.on('end', () => {
                logger_1.logger.warn('Redis client disconnected');
                this.isConnected = false;
            });
            await this.client.connect();
        }
        catch (error) {
            logger_1.logger.error('Redis initialization failed:', error);
            throw error;
        }
    }
    static async disconnect() {
        try {
            if (this.client && this.isConnected) {
                await this.client.quit();
                this.isConnected = false;
                logger_1.logger.info('Redis client disconnected');
            }
        }
        catch (error) {
            logger_1.logger.error('Redis disconnection failed:', error);
        }
    }
    static getClient() {
        if (!this.isConnected || !this.client) {
            throw new Error('Redis not connected');
        }
        return this.client;
    }
    static isHealthy() {
        return this.isConnected;
    }
    static async set(key, value, ttl) {
        try {
            const serializedValue = JSON.stringify(value);
            if (ttl) {
                await this.client.setEx(key, ttl, serializedValue);
            }
            else {
                await this.client.set(key, serializedValue);
            }
        }
        catch (error) {
            logger_1.logger.error('Redis SET failed:', error);
            throw error;
        }
    }
    static async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger_1.logger.error('Redis GET failed:', error);
            throw error;
        }
    }
    static async del(key) {
        try {
            await this.client.del(key);
        }
        catch (error) {
            logger_1.logger.error('Redis DEL failed:', error);
            throw error;
        }
    }
    static async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Redis EXISTS failed:', error);
            throw error;
        }
    }
    static async expire(key, ttl) {
        try {
            await this.client.expire(key, ttl);
        }
        catch (error) {
            logger_1.logger.error('Redis EXPIRE failed:', error);
            throw error;
        }
    }
    static async hset(key, field, value) {
        try {
            const serializedValue = JSON.stringify(value);
            await this.client.hSet(key, field, serializedValue);
        }
        catch (error) {
            logger_1.logger.error('Redis HSET failed:', error);
            throw error;
        }
    }
    static async hget(key, field) {
        try {
            const value = await this.client.hGet(key, field);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger_1.logger.error('Redis HGET failed:', error);
            throw error;
        }
    }
    static async hgetall(key) {
        try {
            const hash = await this.client.hGetAll(key);
            const result = {};
            for (const [field, value] of Object.entries(hash)) {
                result[field] = JSON.parse(value);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error('Redis HGETALL failed:', error);
            throw error;
        }
    }
    static async lpush(key, ...values) {
        try {
            const serializedValues = values.map(v => JSON.stringify(v));
            await this.client.lPush(key, serializedValues);
        }
        catch (error) {
            logger_1.logger.error('Redis LPUSH failed:', error);
            throw error;
        }
    }
    static async rpush(key, ...values) {
        try {
            const serializedValues = values.map(v => JSON.stringify(v));
            await this.client.rPush(key, serializedValues);
        }
        catch (error) {
            logger_1.logger.error('Redis RPUSH failed:', error);
            throw error;
        }
    }
    static async lrange(key, start, stop) {
        try {
            const values = await this.client.lRange(key, start, stop);
            return values.map(v => JSON.parse(v));
        }
        catch (error) {
            logger_1.logger.error('Redis LRANGE failed:', error);
            throw error;
        }
    }
    static async sadd(key, ...members) {
        try {
            const serializedMembers = members.map(m => JSON.stringify(m));
            await this.client.sAdd(key, serializedMembers);
        }
        catch (error) {
            logger_1.logger.error('Redis SADD failed:', error);
            throw error;
        }
    }
    static async smembers(key) {
        try {
            const members = await this.client.sMembers(key);
            return members.map(m => JSON.parse(m));
        }
        catch (error) {
            logger_1.logger.error('Redis SMEMBERS failed:', error);
            throw error;
        }
    }
    static async setSession(sessionId, data, ttl = 3600) {
        await this.set(`session:${sessionId}`, data, ttl);
    }
    static async getSession(sessionId) {
        return await this.get(`session:${sessionId}`);
    }
    static async deleteSession(sessionId) {
        await this.del(`session:${sessionId}`);
    }
    static async cache(key, fetcher, ttl = 300) {
        try {
            const cached = await this.get(key);
            if (cached !== null) {
                return cached;
            }
            const data = await fetcher();
            await this.set(key, data, ttl);
            return data;
        }
        catch (error) {
            logger_1.logger.error('Cache operation failed:', error);
            return await fetcher();
        }
    }
}
exports.RedisService = RedisService;
//# sourceMappingURL=redis.js.map