'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('member_subscriptions', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      member_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      }, // Note: member_id foreign key will be added after members table is created
      package_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'membership_packages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      actual_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'),
        defaultValue: 'PENDING',
        allowNull: false
      },
      renewal_reminder_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      renewal_reminder_sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      registered_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Add indexes
    await queryInterface.addIndex('member_subscriptions', ['status']);
    await queryInterface.addIndex('member_subscriptions', ['start_date', 'end_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('member_subscriptions');
  }
};