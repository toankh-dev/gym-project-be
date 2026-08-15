'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('exercises', {
            id: {
                type: Sequelize.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: Sequelize.STRING(150),
                allowNull: false,
                unique: true
            },
            category: {
                type: Sequelize.ENUM('CARDIO', 'STRENGTH', 'FLEXIBILITY', 'BALANCE', 'FUNCTIONAL', 'SPORTS_SPECIFIC'),
                allowNull: false
            },
            muscle_group: {
                type: Sequelize.ENUM('CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'CORE', 'LEGS', 'GLUTES', 'FULL_BODY'),
                allowNull: false
            },
            equipment_needed: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            difficulty_level: {
                type: Sequelize.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            instructions: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            safety_tips: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            video_url: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            image_url: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            calories_per_minute: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false
            },
            created_by: {
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
        await queryInterface.addIndex('exercises', ['name']);
        await queryInterface.addIndex('exercises', ['category']);
        await queryInterface.addIndex('exercises', ['muscle_group']);
        await queryInterface.addIndex('exercises', ['difficulty_level']);
        await queryInterface.addIndex('exercises', ['is_active']);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('exercises');
    }
};
//# sourceMappingURL=20260528-14-create-exercises.js.map