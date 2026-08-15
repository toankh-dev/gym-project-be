import { RedisClientType } from 'redis';
export declare const connectRedis: () => Promise<RedisClientType<any>>;
export declare const disconnectRedis: () => Promise<void>;
export declare class RedisService {
    private client;
    constructor(client: RedisClientType<any>);
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<boolean>;
    setObject(key: string, obj: any, ttlSeconds?: number): Promise<void>;
    getObject<T>(key: string): Promise<T | null>;
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<boolean>;
    keys(pattern: string): Promise<string[]>;
    clearPattern(pattern: string): Promise<number>;
    setSession(sessionId: string, data: any, ttlSeconds?: number): Promise<void>;
    getSession<T>(sessionId: string): Promise<T | null>;
    deleteSession(sessionId: string): Promise<number>;
    cacheSet(key: string, data: any, ttlSeconds?: number): Promise<void>;
    cacheGet<T>(key: string): Promise<T | null>;
    cacheInvalidate(pattern: string): Promise<number>;
    rateLimitCheck(key: string, limit: number, windowSeconds: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }>;
}
export declare const getRedisService: () => Promise<RedisService>;
declare const _default: {
    connectRedis: () => Promise<RedisClientType<any>>;
    disconnectRedis: () => Promise<void>;
    getRedisService: () => Promise<RedisService>;
};
export default _default;
//# sourceMappingURL=redis.config.d.ts.map