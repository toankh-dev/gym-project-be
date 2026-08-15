'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('member_preferences', {
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
            // Notification preferences
            notify_email: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            notify_sms: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            notify_push: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            notify_workout_reminders: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            notify_subscription_expiry: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            notify_trainer_messages: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            // Privacy preferences
            profile_visibility: {
                type: Sequelize.ENUM('PUBLIC', 'MEMBERS_ONLY', 'PRIVATE'),
                allowNull: false,
                defaultValue: 'MEMBERS_ONLY'
            },
            show_progress: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            show_stats: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
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
        await queryInterface.addIndex('member_preferences', ['member_id']);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('member_preferences');
    }
};
//# sourceMappingURL=20260529-19-create-member-preferences.js.map