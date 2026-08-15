'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('training_schedules', {
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
            class_name: {
                type: Sequelize.STRING(150),
                allowNull: false
            },
            class_type: {
                type: Sequelize.ENUM('GROUP_CLASS', 'PERSONAL_TRAINING', 'WORKSHOP'),
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            start_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            end_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            start_time: {
                type: Sequelize.TIME,
                allowNull: false
            },
            end_time: {
                type: Sequelize.TIME,
                allowNull: false
            },
            day_of_week: {
                type: Sequelize.ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
                allowNull: false
            },
            max_capacity: {
                type: Sequelize.INTEGER,
                defaultValue: 1,
                allowNull: false
            },
            current_enrollment: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false
            },
            price_per_session: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true
            },
            location: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'),
                defaultValue: 'SCHEDULED',
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
        await queryInterface.addIndex('training_schedules', ['trainer_id']);
        await queryInterface.addIndex('training_schedules', ['start_date']);
        await queryInterface.addIndex('training_schedules', ['day_of_week']);
        await queryInterface.addIndex('training_schedules', ['class_type']);
        await queryInterface.addIndex('training_schedules', ['status']);
        await queryInterface.addIndex('training_schedules', ['start_time']);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('training_schedules');
    }
};
//# sourceMappingURL=20260528-11-create-training-schedules.js.map