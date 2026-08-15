'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create member_profiles table
    await queryInterface.createTable('member_profiles', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      member_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        references: {
          model: 'members',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      height_cm: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      weight_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      bmi: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      body_fat_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      muscle_mass_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      fitness_goal: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      training_level: {
        type: Sequelize.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
        defaultValue: 'BEGINNER',
        allowNull: false
      },
      health_condition: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      medical_note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      emergency_contact_name: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      emergency_contact_phone: {
        type: Sequelize.STRING(20),
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

    // Create trainer_profiles table
    await queryInterface.createTable('trainer_profiles', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      trainer_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        references: {
          model: 'trainers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      certificate: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      certificates_detail: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      education: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      skills: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      work_experience: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      introduction: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      training_philosophy: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      achievements: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      available_time: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      facebook_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      instagram_url: {
        type: Sequelize.STRING(255),
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

    // Create trainer_specializations junction table
    await queryInterface.createTable('trainer_specializations', {
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
      specialization_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'specializations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    // Add unique constraint
    await queryInterface.addConstraint('trainer_specializations', {
      fields: ['trainer_id', 'specialization_id'],
      type: 'unique',
      name: 'uq_trainer_specialization'
    });

    // Create staffs table
    await queryInterface.createTable('staffs', {
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
      staff_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      position: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      hire_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
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
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('staffs');
    await queryInterface.dropTable('trainer_specializations');
    await queryInterface.dropTable('trainer_profiles');
    await queryInterface.dropTable('member_profiles');
  }
};