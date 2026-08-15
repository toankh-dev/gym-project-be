'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('members', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      member_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      join_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      membership_status: {
        type: Sequelize.ENUM('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'),
        defaultValue: 'ACTIVE',
        allowNull: false
      },
      current_subscription_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'member_subscriptions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assigned_trainer_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
        // trainer foreign key will be added after trainers table is created
      },
      note: {
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
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    // Add indexes
    await queryInterface.addIndex('members', ['membership_status']);
    await queryInterface.addIndex('members', ['user_id', 'membership_status']);

    // Now add the foreign key from member_subscriptions to members
    await queryInterface.addConstraint('member_subscriptions', {
      fields: ['member_id'],
      type: 'foreign key',
      name: 'fk_member_subscriptions_member',
      references: {
        table: 'members',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('member_subscriptions', 'fk_member_subscriptions_member');
    await queryInterface.dropTable('members');
  }
};