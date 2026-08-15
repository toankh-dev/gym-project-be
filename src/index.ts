import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
// import RedisStore from 'connect-redis';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDatabase } from '@/config/database.config';
// import { connectRedis as redisClient } from '@/config/redis.config';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middlewares/error.middleware';
import { notFoundHandler } from '@/middlewares/notFound.middleware';
import routes from '@/routes';
// Import models to initialize associations
import '@/models';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy for nginx
app.set('trust proxy', 1);

// Security middlewares
app.use(helmet({
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
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3001',
      'http://localhost:80',
      'http://localhost'
    ];

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// Body parsing
app.use(compression());
app.use(express.json({ limit: process.env.UPLOAD_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.UPLOAD_LIMIT || '10mb' }));
app.use(cookieParser());

// Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10000'),
//   message: {
//     error: 'Too many requests from this IP, please try again later',
//     retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use('/api', limiter);

// Session configuration (using memory store for development)
const setupSession = async () => {
  try {
    // TODO: Enable Redis session store in production
    app.use(session({
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

    logger.info('Session store configured (memory store)');
  } catch (error) {
    logger.error('Failed to setup session store:', error);
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
app.use('/api', routes);

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Setup Redis session store
    await setupSession();
    logger.info('Redis session store configured');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`📊 API Health: http://localhost:${PORT}/api/health`);

      if (NODE_ENV === 'development') {
        logger.info(`📖 API Docs: http://localhost:${PORT}/api/docs`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize application
startServer();

export default app;