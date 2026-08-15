'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash the default password
    const defaultPassword = await bcrypt.hash('password', 12);

    await queryInterface.bulkInsert('users', [
      // Admin User
      {
        id: 1,
        role_id: 1, // ADMIN
        username: 'admin',
        email: 'admin@gym.com',
        password_hash: defaultPassword,
        phone: '0123456789',
        status: 'ACTIVE',
        last_login_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      // Staff User
      {
        id: 2,
        role_id: 2, // STAFF
        username: 'staff',
        email: 'staff@gym.com',
        password_hash: defaultPassword,
        phone: '0123456790',
        status: 'ACTIVE',
        last_login_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      // Trainer Users
      {
        id: 3,
        role_id: 3, // TRAINER
        username: 'trainer1',
        email: 'trainer@gym.com',
        password_hash: defaultPassword,
        phone: '0123456791',
        status: 'ACTIVE',
        last_login_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        role_id: 3, // TRAINER
        username: 'trainer2',
        email: 'trainer2@gym.com',
        password_hash: defaultPassword,
        phone: '0123456792',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      // Member Users
      {
        id: 5,
        role_id: 4, // MEMBER
        username: 'member1',
        email: 'member@gym.com',
        password_hash: defaultPassword,
        phone: '0123456793',
        status: 'ACTIVE',
        last_login_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 6,
        role_id: 4, // MEMBER
        username: 'member2',
        email: 'member2@gym.com',
        password_hash: defaultPassword,
        phone: '0123456794',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 7,
        role_id: 4, // MEMBER
        username: 'member3',
        email: 'member3@gym.com',
        password_hash: defaultPassword,
        phone: '0123456795',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {});
  }
};
