'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('roles', [
            {
                id: 1,
                name: 'ADMIN',
                description: 'System administrator with full access',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 2,
                name: 'STAFF',
                description: 'Staff member with limited admin access',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 3,
                name: 'TRAINER',
                description: 'Personal trainer with member management access',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 4,
                name: 'MEMBER',
                description: 'Gym member with basic access',
                created_at: new Date(),
                updated_at: new Date()
            }
        ], {});
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('roles', {}, {});
    }
};
//# sourceMappingURL=001-roles.js.map