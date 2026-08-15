'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        // Create members
        await queryInterface.bulkInsert('members', [
            {
                id: 1,
                user_id: 5,
                member_code: 'M26001',
                join_date: '2026-01-15',
                membership_status: 'ACTIVE',
                current_subscription_id: null, // Will be set when subscriptions are created
                assigned_trainer_id: 1, // Assigned to John
                note: 'Motivated member with weight loss goals',
                created_at: new Date('2026-01-15'),
                updated_at: new Date()
            },
            {
                id: 2,
                user_id: 6,
                member_code: 'M26002',
                join_date: '2026-02-01',
                membership_status: 'ACTIVE',
                current_subscription_id: null,
                assigned_trainer_id: 2, // Assigned to Sarah
                note: 'New member interested in yoga and flexibility',
                created_at: new Date('2026-02-01'),
                updated_at: new Date()
            },
            {
                id: 3,
                user_id: 7,
                member_code: 'M26003',
                join_date: '2026-03-10',
                membership_status: 'ACTIVE',
                current_subscription_id: null,
                assigned_trainer_id: 1, // Assigned to John
                note: 'Working professional, prefers evening sessions',
                created_at: new Date('2026-03-10'),
                updated_at: new Date()
            }
        ]);
        // Create member profiles
        await queryInterface.bulkInsert('member_profiles', [
            {
                id: 1,
                member_id: 1,
                height_cm: 165.0,
                weight_kg: 75.5,
                bmi: 27.7, // Will be auto-calculated
                body_fat_percent: 28.5,
                muscle_mass_kg: 45.2,
                fitness_goal: 'Lose 15kg and improve overall fitness',
                training_level: 'BEGINNER',
                health_condition: 'No major health issues. Mild lower back discomfort from desk job.',
                medical_note: 'Cleared by physician for exercise. Recommend avoiding heavy deadlifts initially.',
                emergency_contact_name: 'Robert Member',
                emergency_contact_phone: '0123456800',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 2,
                member_id: 2,
                height_cm: 172.0,
                weight_kg: 68.0,
                bmi: 23.0,
                body_fat_percent: 22.0,
                muscle_mass_kg: 48.5,
                fitness_goal: 'Improve flexibility and core strength, stress management',
                training_level: 'BEGINNER',
                health_condition: 'Occasional stress and anxiety. Looking for mindful movement.',
                medical_note: 'No physical limitations. Interested in yoga for mental health benefits.',
                emergency_contact_name: 'Susan Wilson',
                emergency_contact_phone: '0123456801',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 3,
                member_id: 3,
                height_cm: 160.0,
                weight_kg: 58.0,
                bmi: 22.7,
                body_fat_percent: 25.0,
                muscle_mass_kg: 40.2,
                fitness_goal: 'Build strength and energy for busy work schedule',
                training_level: 'INTERMEDIATE',
                health_condition: 'Generally healthy. Occasionally experiences work-related stress.',
                medical_note: 'Previous gym experience. Prefers efficient, time-effective workouts.',
                emergency_contact_name: 'David Chen',
                emergency_contact_phone: '0123456802',
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('member_profiles', {});
        await queryInterface.bulkDelete('members', {});
    }
};
//# sourceMappingURL=006-members.js.map