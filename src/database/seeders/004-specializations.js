'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('specializations', [
      {
        id: 1,
        name: 'Weight Loss',
        description: 'Training programs focused on fat loss and body recomposition through cardio and strength training',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        name: 'Muscle Gain',
        description: 'Strength and hypertrophy-focused training for building lean muscle mass',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        name: 'Cardio Training',
        description: 'Cardiovascular fitness and endurance improvement programs',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        name: 'Yoga & Flexibility',
        description: 'Yoga instruction, flexibility training, and mind-body wellness',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 5,
        name: 'Sports Performance',
        description: 'Athletic performance enhancement and sport-specific training',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 6,
        name: 'Rehabilitation',
        description: 'Post-injury rehabilitation and corrective exercise programs',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 7,
        name: 'Nutrition Coaching',
        description: 'Dietary guidance and nutrition planning for fitness goals',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 8,
        name: 'Senior Fitness',
        description: 'Safe and effective fitness programs designed for older adults',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 9,
        name: 'Group Classes',
        description: 'Leading group fitness classes and bootcamp-style workouts',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 10,
        name: 'Powerlifting',
        description: 'Competitive powerlifting training and technique coaching',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('specializations', {});
  }
};
