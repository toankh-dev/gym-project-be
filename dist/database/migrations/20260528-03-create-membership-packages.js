'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('membership_packages', {
            id: {
                type: Sequelize.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            duration_months: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            price: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            benefits: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            max_sessions: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            allow_trainer: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
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
            }
        }, {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('membership_packages');
    }
};
//# sourceMappingURL=20260528-03-create-membership-packages.js.map