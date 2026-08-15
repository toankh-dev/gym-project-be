'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('payments', {
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
                onDelete: 'RESTRICT'
            },
            subscription_id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
                references: {
                    model: 'member_subscriptions',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            payment_method: {
                type: Sequelize.ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'E_WALLET'),
                allowNull: false
            },
            payment_type: {
                type: Sequelize.ENUM('MEMBERSHIP_FEE', 'PERSONAL_TRAINING', 'PRODUCT', 'SERVICE', 'OTHER'),
                allowNull: false
            },
            payment_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            payment_status: {
                type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
                defaultValue: 'PENDING',
                allowNull: false
            },
            transaction_reference: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            processed_by: {
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
        await queryInterface.addIndex('payments', ['member_id']);
        await queryInterface.addIndex('payments', ['subscription_id']);
        await queryInterface.addIndex('payments', ['payment_date']);
        await queryInterface.addIndex('payments', ['payment_status']);
        await queryInterface.addIndex('payments', ['payment_method']);
        await queryInterface.addIndex('payments', ['payment_type']);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('payments');
    }
};
//# sourceMappingURL=20260528-10-create-payments.js.map