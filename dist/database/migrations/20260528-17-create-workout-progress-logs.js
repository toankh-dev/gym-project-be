'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('workout_progress_logs', {
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
            workout_plan_id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
                references: {
                    model: 'workout_plans',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
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
            workout_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            sets_completed: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            reps_completed: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            weight_used_kg: {
                type: Sequelize.DECIMAL(6, 2),
                allowNull: true
            },
            duration_minutes: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            calories_burned: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            difficulty_rating: {
                type: Sequelize.ENUM('1', '2', '3', '4', '5'),
                allowNull: true,
                comment: '1=Very Easy, 5=Very Hard'
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
        await queryInterface.addIndex('workout_progress_logs', ['member_id']);
        await queryInterface.addIndex('workout_progress_logs', ['workout_plan_id']);
        await queryInterface.addIndex('workout_progress_logs', ['exercise_id']);
        await queryInterface.addIndex('workout_progress_logs', ['workout_date']);
        await queryInterface.addIndex('workout_progress_logs', ['member_id', 'workout_date']);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('workout_progress_logs');
    }
};
//# sourceMappingURL=20260528-17-create-workout-progress-logs.js.map