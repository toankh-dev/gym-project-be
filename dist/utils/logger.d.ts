import winston from 'winston';
export declare const logger: winston.Logger;
export declare const httpLogger: winston.Logger;
export declare const dbLogger: winston.Logger;
export declare const authLogger: winston.Logger;
export declare const cacheLogger: winston.Logger;
export declare const loggers: {
    app: {
        debug: (message: string, meta?: any) => winston.Logger;
        info: (message: string, meta?: any) => winston.Logger;
        warn: (message: string, meta?: any) => winston.Logger;
        error: (message: string, error?: Error | any, meta?: any) => void;
    };
    http: {
        request: (method: string, url: string, ip: string, userAgent?: string) => void;
        response: (method: string, url: string, statusCode: number, responseTime: number) => void;
        error: (method: string, url: string, statusCode: number, error: Error) => void;
    };
    db: {
        query: (sql: string, duration?: number) => void;
        error: (operation: string, error: Error, meta?: any) => void;
        connection: (status: "connected" | "disconnected" | "error", meta?: any) => void;
    };
    auth: {
        login: (userId: number, email: string, ip: string, success: boolean) => void;
        logout: (userId: number, email: string) => void;
        register: (email: string, ip: string, success: boolean) => void;
        passwordReset: (email: string, ip: string) => void;
        tokenError: (error: string, token?: string, ip?: string) => void;
    };
    cache: {
        hit: (key: string, ttl?: number) => void;
        miss: (key: string) => void;
        set: (key: string, ttl: number) => void;
        delete: (key: string) => void;
        error: (operation: string, key: string, error: Error) => void;
    };
    business: {
        memberRegistered: (memberId: number, memberCode: string) => void;
        subscriptionCreated: (subscriptionId: number, memberId: number, packageId: number) => void;
        paymentProcessed: (paymentId: number, amount: number, status: string) => void;
        scheduleBooked: (scheduleId: number, memberId: number) => void;
    };
};
export declare const logError: (error: Error, context?: string, meta?: any) => void;
export declare const logPerformance: (operation: string, startTime: number, meta?: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map