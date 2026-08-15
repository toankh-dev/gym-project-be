'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        const today = new Date();
        const dateOffset = (n) => {
            const d = new Date();
            d.setDate(today.getDate() + n);
            return d.toISOString().split('T')[0];
        };
        await queryInterface.bulkInsert('training_schedules', [
            {
                id: 1,
                trainer_id: 1,
                class_name: 'Morning Strength Bootcamp',
                class_type: 'GROUP_CLASS',
                description: 'High-intensity strength circuit for all levels.',
                start_date: dateOffset(0),
                end_date: dateOffset(0),
                start_time: '07:00:00',
                end_time: '08:00:00',
                day_of_week: 'MONDAY',
                max_capacity: 15,
                current_enrollment: 2,
                price_per_session: 150000,
                location: 'Studio A',
                status: 'SCHEDULED',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 2,
                trainer_id: 2,
                class_name: 'Evening Yoga Flow',
                class_type: 'GROUP_CLASS',
                description: 'Relaxing vinyasa yoga to unwind after work.',
                start_date: dateOffset(1),
                end_date: dateOffset(1),
                start_time: '18:30:00',
                end_time: '19:30:00',
                day_of_week: 'TUESDAY',
                max_capacity: 20,
                current_enrollment: 1,
                price_per_session: 120000,
                location: 'Studio B',
                status: 'SCHEDULED',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 3,
                trainer_id: 1,
                class_name: 'Personal Training - Weight Loss',
                class_type: 'PERSONAL_TRAINING',
                description: 'One-on-one personalized weight loss session.',
                start_date: dateOffset(2),
                end_date: dateOffset(2),
                start_time: '09:00:00',
                end_time: '10:00:00',
                day_of_week: 'WEDNESDAY',
                max_capacity: 1,
                current_enrollment: 1,
                price_per_session: 400000,
                location: 'Training Room 1',
                status: 'SCHEDULED',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 4,
                trainer_id: 2,
                class_name: 'Flexibility Workshop',
                class_type: 'WORKSHOP',
                description: 'Workshop focused on improving mobility and flexibility.',
                start_date: dateOffset(-3),
                end_date: dateOffset(-3),
                start_time: '15:00:00',
                end_time: '17:00:00',
                day_of_week: 'SATURDAY',
                max_capacity: 25,
                current_enrollment: 3,
                price_per_session: 200000,
                location: 'Main Hall',
                status: 'COMPLETED',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 5,
                trainer_id: 1,
                class_name: 'HIIT Cardio Blast',
                class_type: 'GROUP_CLASS',
                description: 'Fast-paced interval cardio training.',
                start_date: dateOffset(3),
                end_date: dateOffset(3),
                start_time: '17:00:00',
                end_time: '17:45:00',
                day_of_week: 'THURSDAY',
                max_capacity: 18,
                current_enrollment: 0,
                price_per_session: 130000,
                location: 'Studio A',
                status: 'SCHEDULED',
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('training_schedules', {});
    }
};
//# sourceMappingURL=011-training-schedules.js.map