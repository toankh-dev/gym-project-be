'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trainers', {
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
      trainer_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      experience_years: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      rating_avg: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE',
        allowNull: false
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

    await queryInterface.addIndex('trainers', ['user_id']);
    await queryInterface.addIndex('trainers', ['trainer_code']);
    await queryInterface.addIndex('trainers', ['status']);
    await queryInterface.addIndex('trainers', ['rating_avg']);
    await queryInterface.addIndex('trainers', ['experience_years']);
    await queryInterface.addIndex('trainers', ['status', 'rating_avg']);

    // Now we can add the trainer foreign key to members table
    await queryInterface.addConstraint('members', {
      fields: ['assigned_trainer_id'],
      type: 'foreign key',
      name: 'fk_members_assigned_trainer',
      references: {
        table: 'trainers',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('members', 'fk_members_assigned_trainer');
    await queryInterface.dropTable('trainers');
  }
};