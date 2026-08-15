'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('roles', {
            id: {
                type: Sequelize.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: Sequelize.ENUM('ADMIN', 'STAFF', 'TRAINER', 'MEMBER'),
                allowNull: false,
                unique: true
            },
            description: {
                type: Sequelize.STRING(255),
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
        // Add indexes if they don't exist
        try {
            await queryInterface.addIndex('roles', ['name'], { name: 'roles_name' });
        }
        catch (error) {
            console.log('Index roles_name already exists, skipping...');
        }
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('roles');
    }
};
//# sourceMappingURL=20260528-01-create-roles.js.map