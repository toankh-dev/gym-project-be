"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.connectDatabase = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const logger_1 = require("@/utils/logger");
const config = {
    development: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USER || 'gym_user',
        password: process.env.DB_PASSWORD || 'secure_password123',
        database: process.env.DB_NAME || 'gym_management_system',
        dialect: 'mysql',
        timezone: '+07:00', // Vietnam timezone
        logging: (sql) => logger_1.logger.debug(sql),
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            underscored: true,
            paranoid: true, // Enable soft deletes
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            deletedAt: 'deleted_at'
        }
    },
    test: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USER || 'gym_user',
        password: process.env.DB_PASSWORD || 'secure_password123',
        database: process.env.DB_NAME + '_test' || 'gym_management_system_test',
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            underscored: true,
            paranoid: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            deletedAt: 'deleted_at'
        }
    },
    production: {
        host: process.env.DB_HOST || 'mysql',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USER || 'gym_user',
        password: process.env.DB_PASSWORD || 'secure_password123',
        database: process.env.DB_NAME || 'gym_management_system',
        dialect: 'mysql',
        timezone: '+07:00',
        logging: false, // Disable SQL logging in production
        pool: {
            max: 20,
            min: 5,
            acquire: 60000,
            idle: 10000
        },
        define: {
            underscored: true,
            paranoid: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            deletedAt: 'deleted_at'
        }
    }
};
const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];
// Create Sequelize instance
exports.sequelize = new sequelize_1.Sequelize(dbConfig);
// Test database connection
const connectDatabase = async () => {
    try {
        await exports.sequelize.authenticate();
        logger_1.logger.info(`Database connection established successfully (${environment})`);
        if (process.env.NODE_ENV === 'development') {
            // No need to sync - using migrations instead
            logger_1.logger.info('Database ready for use (using migrations)');
        }
    }
    catch (error) {
        logger_1.logger.error('Unable to connect to the database:', error);
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
// Close database connection
const closeDatabase = async () => {
    try {
        await exports.sequelize.close();
        logger_1.logger.info('Database connection closed');
    }
    catch (error) {
        logger_1.logger.error('Error closing database connection:', error);
        throw error;
    }
};
exports.closeDatabase = closeDatabase;
exports.default = exports.sequelize;
//# sourceMappingURL=database.config.js.map