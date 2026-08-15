"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
// import RedisStore from 'connect-redis';
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_config_1 = require("@/config/database.config");
// import { connectRedis as redisClient } from '@/config/redis.config';
const logger_1 = require("@/utils/logger");
const error_middleware_1 = require("@/middlewares/error.middleware");
const notFound_middleware_1 = require("@/middlewares/notFound.middleware");
const routes_1 = __importDefault(require("@/routes"));
// Import models to initialize associations
require("@/models");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Trust proxy for nginx
app.set('trust proxy', 1);
// Security middlewares
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
            'http://localhost:80',
            'http://localhost'
        ];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Request logging
if (NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined', {
        stream: { write: (message) => logger_1.logger.info(message.trim()) }
    }));
}
// Body parsing
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: process.env.UPLOAD_LIMIT || '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: process.env.UPLOAD_LIMIT || '10mb' }));
app.use((0, cookie_parser_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10000'),
    message: {
        error: 'Too many requests from this IP, please try again later',
        retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// Session configuration (using memory store for development)
const setupSession = async () => {
    try {
        // TODO: Enable Redis session store in production
        app.use((0, express_session_1.default)({
            secret: process.env.SESSION_SECRET || 'fallback-secret',
            resave: false,
            saveUninitialized: false,
            name: 'gym.session.id',
            cookie: {
                secure: NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                sameSite: NODE_ENV === 'production' ? 'strict' : 'lax'
            }
        }));
        logger_1.logger.info('Session store configured (memory store)');
    }
    catch (error) {
        logger_1.logger.error('Failed to setup session store:', error);
    }
};
// Health check endpoint
app.get('/api/health', (_, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    });
});
// API routes
app.use('/api', routes_1.default);
// Static file serving for uploads
app.use('/uploads', express_1.default.static('uploads'));
// 404 handler
app.use(notFound_middleware_1.notFoundHandler);
// Global error handler
app.use(error_middleware_1.errorHandler);
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Start server
const startServer = async () => {
    try {
        // Connect to database
        await (0, database_config_1.connectDatabase)();
        logger_1.logger.info('Database connected successfully');
        // Setup Redis session store
        await setupSession();
        logger_1.logger.info('Redis session store configured');
        // Start HTTP server
        app.listen(PORT, () => {
            logger_1.logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
            logger_1.logger.info(`📊 API Health: http://localhost:${PORT}/api/health`);
            if (NODE_ENV === 'development') {
                logger_1.logger.info(`📖 API Docs: http://localhost:${PORT}/api/docs`);
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Initialize application
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map