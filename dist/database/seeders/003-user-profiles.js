'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('user_profiles', [
            // Admin Profile
            {
                id: 1,
                user_id: 1,
                full_name: 'System Administrator',
                gender: 'OTHER',
                date_of_birth: '1985-01-01',
                avatar_url: '/uploads/avatars/admin.jpg',
                address: 'Gym Management Office',
                bio: 'System administrator responsible for overall gym operations and management.',
                created_at: new Date(),
                updated_at: new Date()
            },
            // Staff Profile
            {
                id: 2,
                user_id: 2,
                full_name: 'Staff Member',
                gender: 'FEMALE',
                date_of_birth: '1990-03-15',
                avatar_url: '/uploads/avatars/staff.jpg',
                address: '123 Staff Street, City',
                bio: 'Friendly gym staff member helping members with their fitness journey.',
                created_at: new Date(),
                updated_at: new Date()
            },
            // Trainer Profiles
            {
                id: 3,
                user_id: 3,
                full_name: 'John Trainer',
                gender: 'MALE',
                date_of_birth: '1985-06-15',
                avatar_url: '/uploads/avatars/trainer1.jpg',
                address: '456 Fitness Avenue, City',
                bio: 'Certified personal trainer specializing in strength training and weight loss.',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 4,
                user_id: 4,
                full_name: 'Sarah Johnson',
                gender: 'FEMALE',
                date_of_birth: '1988-09-22',
                avatar_url: '/uploads/avatars/trainer2.jpg',
                address: '789 Health Boulevard, City',
                bio: 'Yoga instructor and wellness coach with 8 years of experience.',
                created_at: new Date(),
                updated_at: new Date()
            },
            // Member Profiles
            {
                id: 5,
                user_id: 5,
                full_name: 'Jane Member',
                gender: 'FEMALE',
                date_of_birth: '1992-03-22',
                avatar_url: '/uploads/avatars/member1.jpg',
                address: '321 Member Lane, City',
                bio: 'Fitness enthusiast working towards a healthier lifestyle.',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 6,
                user_id: 6,
                full_name: 'Mike Wilson',
                gender: 'MALE',
                date_of_birth: '1995-07-10',
                avatar_url: '/uploads/avatars/member2.jpg',
                address: '654 Workout Way, City',
                bio: 'New member excited to start fitness journey.',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 7,
                user_id: 7,
                full_name: 'Lisa Chen',
                gender: 'FEMALE',
                date_of_birth: '1987-11-30',
                avatar_url: '/uploads/avatars/member3.jpg',
                address: '987 Strength Street, City',
                bio: 'Working professional balancing career and fitness goals.',
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('user_profiles', {});
    }
};
//# sourceMappingURL=003-user-profiles.js.map