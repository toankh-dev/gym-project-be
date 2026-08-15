"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisService = exports.RedisService = exports.disconnectRedis = exports.connectRedis = void 0;
const redis_1 = require("redis");
const logger_1 = require("@/utils/logger");
let redisClient = null;
const connectRedis = async () => {
    if (redisClient) {
        return redisClient;
    }
    try {
        const client = (0, redis_1.createClient)({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                connectTimeout: 10000
            },
            password: process.env.REDIS_PASSWORD,
            database: 0,
            name: 'gym-management'
        });
        client.on('error', (error) => {
            logger_1.logger.error('Redis Client Error:', error);
        });
        client.on('connect', () => {
            logger_1.logger.info('Redis Client Connected');
        });
        client.on('ready', () => {
            logger_1.logger.info('Redis Client Ready');
        });
        client.on('end', () => {
            logger_1.logger.info('Redis Client Disconnected');
        });
        await client.connect();
        redisClient = client;
        return client;
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to Redis:', error);
        throw error;
    }
};
exports.connectRedis = connectRedis;
const disconnectRedis = async () => {
    if (redisClient) {
        try {
            await redisClient.disconnect();
            redisClient = null;
            logger_1.logger.info('Redis connection closed');
        }
        catch (error) {
            logger_1.logger.error('Error closing Redis connection:', error);
            throw error;
        }
    }
};
exports.disconnectRedis = disconnectRedis;
// Redis utility functions
class RedisService {
    client;
    constructor(client) {
        this.client = client;
    }
    // Set key with TTL
    async set(key, value, ttlSeconds) {
        const prefixedKey = `${process.env.REDIS_PREFIX || 'gym:'}${key}`;
        if (ttlSeconds) {
            await this.client.setEx(prefixedKey, ttlSeconds, value);
        }
        else {
            await this.client.set(prefixedKey, value);
        }
    }
    // Get value by key
    async get(key) {
        const prefixedKey = `${process.env.REDIS_PREFIX || 'gym:'}${key}`;
        return await this.client.get(prefixedKey);
    }
    // Delete key
    async del(key) {
        const prefixedKey = `${process.env.REDIS_PREFIX || 'gym:'}${key}`;
        return await this.client.del(prefixedKey);
    }
    // Check if key exists
    async exists(key) {
        const prefixedKey = `${process.env.REDIS_PREFIX || 'gym:'}${key}`;
        const result = await this.client.exists(prefixedKey);
        return result === 1;
    }
    // Set object with JSON serialization
    async setObject(key, obj, ttlSeconds) {
        await this.set(key, JSON.stringify(obj), ttlSeconds);
    }
    // Get object with JSON deserialization
    async getObject(key) {
        const value = await this.get(key);
        if (value) {
            try {
                return JSON.parse(value);
            }
            catch (error) {
                logger_1.logger.error(`Failed to parse JSON for key ${key}:`, error);
                return null;
            }
        }
        return null;
    }
    // Increment value
    async incr(key) {
        const prefixedKey = `${process.env.REDIS_PREFIX || 'gym:'}${key}`;
        return await this.client.incr(prefixedKey);
    }
    // Set expiration
    async expire(key, seconds) {
        const prefixedKey = `${process.env.REDIS_PREFIX || 'gym:'}${key}`;
        const result = await this.client.expire(prefixedKey, seconds);
        return result;
    }
    // Get all keys matching pattern
    async keys(pattern) {
        const prefixedPattern = `${process.env.REDIS_PREFIX || 'gym:'}${pattern}`;
        return await this.client.keys(prefixedPattern);
    }
    // Clear all keys matching pattern (useful for cache invalidation)
    async clearPattern(pattern) {
        const keys = await this.keys(pattern);
        if (keys.length > 0) {
            const unprefixedKeys = keys.map(key => key.replace(process.env.REDIS_PREFIX || 'gym:', ''));
            return await this.client.del(unprefixedKeys);
        }
        return 0;
    }
    // Session management
    async setSession(sessionId, data, ttlSeconds = 86400) {
        await this.setObject(`session:${sessionId}`, data, ttlSeconds);
    }
    async getSession(sessionId) {
        return await this.getObject(`session:${sessionId}`);
    }
    async deleteSession(sessionId) {
        return await this.del(`session:${sessionId}`);
    }
    // Cache management
    async cacheSet(key, data, ttlSeconds = 300) {
        await this.setObject(`cache:${key}`, data, ttlSeconds);
    }
    async cacheGet(key) {
        return await this.getObject(`cache:${key}`);
    }
    async cacheInvalidate(pattern) {
        return await this.clearPattern(`cache:${pattern}`);
    }
    // Rate limiting
    async rateLimitCheck(key, limit, windowSeconds) {
        const rateLimitKey = `rate_limit:${key}`;
        const current = await this.incr(rateLimitKey);
        if (current === 1) {
            await this.expire(rateLimitKey, windowSeconds);
        }
        const remaining = Math.max(0, limit - current);
        const resetTime = Date.now() + (windowSeconds * 1000);
        return {
            allowed: current <= limit,
            remaining,
            resetTime
        };
    }
}
exports.RedisService = RedisService;
// Export singleton instance
let redisService = null;
const getRedisService = async () => {
    if (!redisService) {
        const client = await (0, exports.connectRedis)();
        redisService = new RedisService(client);
    }
    return redisService;
};
exports.getRedisService = getRedisService;
exports.default = { connectRedis: exports.connectRedis, disconnectRedis: exports.disconnectRedis, getRedisService: exports.getRedisService };
//# sourceMappingURL=redis.config.js.map