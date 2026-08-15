'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workout_plans', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      member_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'members',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      trainer_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'trainers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      plan_name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      goal: {
        type: Sequelize.ENUM('WEIGHT_LOSS', 'MUSCLE_GAIN', 'ENDURANCE', 'STRENGTH', 'GENERAL_FITNESS', 'REHABILITATION'),
        allowNull: false
      },
      difficulty_level: {
        type: Sequelize.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
        allowNull: false
      },
      duration_weeks: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      sessions_per_week: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'),
        defaultValue: 'DRAFT',
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('workout_plans', ['member_id']);
    await queryInterface.addIndex('workout_plans', ['trainer_id']);
    await queryInterface.addIndex('workout_plans', ['goal']);
    await queryInterface.addIndex('workout_plans', ['difficulty_level']);
    await queryInterface.addIndex('workout_plans', ['status']);
    await queryInterface.addIndex('workout_plans', ['start_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('workout_plans');
  }
};