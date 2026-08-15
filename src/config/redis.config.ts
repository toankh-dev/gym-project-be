import { createClient, RedisClientType } from 'redis';
import { logger } from '@/utils/logger';

let redisClient: RedisClientType<any> | null = null;

export const connectRedis = async (): Promise<RedisClientType<any>> => {
  if (redisClient) {
    return redisClient;
  }

  try {
    const client = createClient({
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
      logger.error('Redis Client Error:', error);
    });

    client.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    client.on('ready', () => {
      logger.info('Redis Client Ready');
    });

    client.on('end', () => {
      logger.info('Redis Client Disconnected');
    });

    await client.connect();

    redisClient = client;
    return client;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.disconnect();
      redisClient = null;
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
      throw error;
    }
  }
};

// Redis utility functions
export class RedisService {
  private client: RedisClientType<any>;

  constructor(client: RedisClientType<any>) {
    this.client = client;
  }

  // Set key with TTL
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const prefixedKey = `${process.env.REDIS_PREFIX || 'gym:'}${key}`;

    if (ttlSeconds) {
      await this.client.setEx(prefixedKey, ttlSeconds, value);
    } else {
      await this.client.set(prefixedKey, value);
    }
  }

  // Get value by key
  async get(key: string): Promise<string | null> {
    const prefixedKey = `${process.env.REDIS_PREFIX || 'gym:'}${key}`;
    return await this.client.get(prefixedKey);
  }

  // Delete key
  async del(key: string): Promise<number> {
    const prefixedKey = `${process.env.REDIS_PREFIX || 'gym:'}${key}`;
    return await this.client.del(prefixedKey);
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const prefixedKey = `${process.env.REDIS_PREFIX || 'gym:'}${key}`;
    const result = await this.client.exists(prefixedKey);
    return result === 1;
  }

  // Set object with JSON serialization
  async setObject(key: string, obj: any, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(obj), ttlSeconds);
  }

  // Get object with JSON deserialization
  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch (error) {
        logger.error(`Failed to parse JSON for key ${key}:`, error);
        return null;
      }
    }
    return null;
  }

  // Increment value
  async incr(key: string): Promise<number> {
    const prefixedKey = `${process.env.REDIS_PREFIX || 'gym:'}${key}`;
    return await this.client.incr(prefixedKey);
  }

  // Set expiration
  async expire(key: string, seconds: number): Promise<boolean> {
    const prefixedKey = `${process.env.REDIS_PREFIX || 'gym:'}${key}`;
    const result = await this.client.expire(prefixedKey, seconds);
    return result;
  }

  // Get all keys matching pattern
  async keys(pattern: string): Promise<string[]> {
    const prefixedPattern = `${process.env.REDIS_PREFIX || 'gym:'}${pattern}`;
    return await this.client.keys(prefixedPattern);
  }

  // Clear all keys matching pattern (useful for cache invalidation)
  async clearPattern(pattern: string): Promise<number> {
    const keys = await this.keys(pattern);
    if (keys.length > 0) {
      const unprefixedKeys = keys.map(key => key.replace(process.env.REDIS_PREFIX || 'gym:', ''));
      return await this.client.del(unprefixedKeys);
    }
    return 0;
  }

  // Session management
  async setSession(sessionId: string, data: any, ttlSeconds: number = 86400): Promise<void> {
    await this.setObject(`session:${sessionId}`, data, ttlSeconds);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    return await this.getObject<T>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<number> {
    return await this.del(`session:${sessionId}`);
  }

  // Cache management
  async cacheSet(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    await this.setObject(`cache:${key}`, data, ttlSeconds);
  }

  async cacheGet<T>(key: string): Promise<T | null> {
    return await this.getObject<T>(`cache:${key}`);
  }

  async cacheInvalidate(pattern: string): Promise<number> {
    return await this.clearPattern(`cache:${pattern}`);
  }

  // Rate limiting
  async rateLimitCheck(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
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

// Export singleton instance
let redisService: RedisService | null = null;

export const getRedisService = async (): Promise<RedisService> => {
  if (!redisService) {
    const client = await connectRedis();
    redisService = new RedisService(client);
  }
  return redisService;
};

export default { connectRedis, disconnectRedis, getRedisService };