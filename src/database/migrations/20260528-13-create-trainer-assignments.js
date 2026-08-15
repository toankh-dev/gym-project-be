'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trainer_assignments', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      trainer_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'trainers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      assignment_type: {
        type: Sequelize.ENUM('PERSONAL_TRAINING', 'PROGRAM_DESIGN', 'CONSULTATION'),
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
      session_count: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      completed_sessions: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      hourly_rate: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true
      },
      total_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      payment_status: {
        type: Sequelize.ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID'),
        defaultValue: 'UNPAID',
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED'),
        defaultValue: 'ACTIVE',
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

    await queryInterface.addIndex('trainer_assignments', ['trainer_id']);
    await queryInterface.addIndex('trainer_assignments', ['member_id']);
    await queryInterface.addIndex('trainer_assignments', ['assignment_type']);
    await queryInterface.addIndex('trainer_assignments', ['start_date']);
    await queryInterface.addIndex('trainer_assignments', ['status']);
    await queryInterface.addIndex('trainer_assignments', ['payment_status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('trainer_assignments');
  }
};