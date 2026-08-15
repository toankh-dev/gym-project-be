'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('schedule_members', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      schedule_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'training_schedules',
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
      enrollment_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      payment_status: {
        type: Sequelize.ENUM('UNPAID', 'PAID', 'CANCELLED'),
        defaultValue: 'UNPAID',
        allowNull: false
      },
      attendance_status: {
        type: Sequelize.ENUM('REGISTERED', 'ATTENDED', 'ABSENT', 'CANCELLED'),
        defaultValue: 'REGISTERED',
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

    // Add unique constraint
    await queryInterface.addConstraint('schedule_members', {
      fields: ['schedule_id', 'member_id'],
      type: 'unique',
      name: 'uq_schedule_member'
    });

    await queryInterface.addIndex('schedule_members', ['schedule_id']);
    await queryInterface.addIndex('schedule_members', ['member_id']);
    await queryInterface.addIndex('schedule_members', ['enrollment_date']);
    await queryInterface.addIndex('schedule_members', ['payment_status']);
    await queryInterface.addIndex('schedule_members', ['attendance_status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('schedule_members');
  }
};