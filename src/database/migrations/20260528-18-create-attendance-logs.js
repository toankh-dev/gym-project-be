'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance_logs', {
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
      check_in_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      check_out_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      attendance_type: {
        type: Sequelize.ENUM('GYM_VISIT', 'TRAINING_SESSION', 'GROUP_CLASS'),
        defaultValue: 'GYM_VISIT',
        allowNull: false
      },
      schedule_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'training_schedules',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'For training sessions or group classes'
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
      check_in_method: {
        type: Sequelize.ENUM('CARD_SCAN', 'QR_CODE', 'MANUAL', 'MOBILE_APP'),
        defaultValue: 'CARD_SCAN',
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      recorded_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Staff member who recorded attendance'
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

    await queryInterface.addIndex('attendance_logs', ['member_id']);
    await queryInterface.addIndex('attendance_logs', ['check_in_time']);
    await queryInterface.addIndex('attendance_logs', ['attendance_type']);
    await queryInterface.addIndex('attendance_logs', ['schedule_id']);
    await queryInterface.addIndex('attendance_logs', ['trainer_id']);
    await queryInterface.addIndex('attendance_logs', ['member_id', 'check_in_time']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('attendance_logs');
  }
};