'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('workout_plan_exercises', {
            id: {
                type: Sequelize.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true
            },
            workout_plan_id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'workout_plans',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            exercise_id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'exercises',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            day_of_week: {
                type: Sequelize.ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
                allowNull: false
            },
            exercise_order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            sets: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            reps: {
                type: Sequelize.STRING(50),
                allowNull: true,
                comment: 'Can be number or range like "10-12"'
            },
            weight_kg: {
                type: Sequelize.DECIMAL(6, 2),
                allowNull: true
            },
            duration_minutes: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            rest_seconds: {
                type: Sequelize.INTEGER,
                allowNull: true
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
        await queryInterface.addIndex('workout_plan_exercises', ['workout_plan_id']);
        await queryInterface.addIndex('workout_plan_exercises', ['exercise_id']);
        await queryInterface.addIndex('workout_plan_exercises', ['day_of_week']);
        await queryInterface.addIndex('workout_plan_exercises', ['exercise_order']);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('workout_plan_exercises');
    }
};
//# sourceMappingURL=20260528-16-create-workout-plan-exercises.js.map