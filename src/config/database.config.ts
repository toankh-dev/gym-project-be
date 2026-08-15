import { Sequelize, Options } from 'sequelize';
import { logger } from '@/utils/logger';

interface DatabaseConfig {
  development: Options;
  test: Options;
  production: Options;
}

const config: DatabaseConfig = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'gym_user',
    password: process.env.DB_PASSWORD || 'secure_password123',
    database: process.env.DB_NAME || 'gym_management_system',
    dialect: 'mysql',
    timezone: '+07:00', // Vietnam timezone
    logging: (sql: string) => logger.debug(sql),
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

const environment = (process.env.NODE_ENV as keyof DatabaseConfig) || 'development';
const dbConfig = config[environment];

// Create Sequelize instance
export const sequelize = new Sequelize(dbConfig);

// Test database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info(`Database connection established successfully (${environment})`);

    if (process.env.NODE_ENV === 'development') {
      // No need to sync - using migrations instead
      logger.info('Database ready for use (using migrations)');
    }
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

export default sequelize;