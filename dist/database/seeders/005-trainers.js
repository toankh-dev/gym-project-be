'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        // Create trainers
        await queryInterface.bulkInsert('trainers', [
            {
                id: 1,
                user_id: 3,
                trainer_code: 'T26001',
                experience_years: 8,
                rating_avg: 4.7,
                status: 'ACTIVE',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 2,
                user_id: 4,
                trainer_code: 'T26002',
                experience_years: 6,
                rating_avg: 4.5,
                status: 'ACTIVE',
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);
        // Create trainer profiles
        await queryInterface.bulkInsert('trainer_profiles', [
            {
                id: 1,
                trainer_id: 1,
                certificate: 'NASM-CPT, ACSM-EP',
                certificates_detail: 'National Academy of Sports Medicine Certified Personal Trainer, American College of Sports Medicine Exercise Physiologist',
                education: 'Bachelor of Science in Exercise Science, University of Fitness',
                skills: 'Strength Training, Weight Loss, Functional Movement, Injury Prevention, Nutrition Guidance',
                work_experience: '8 years of experience in personal training, worked with over 200 clients ranging from beginners to athletes',
                introduction: 'Hi! I\'m John, your dedicated personal trainer with a passion for helping people achieve their fitness goals. I specialize in strength training and weight loss programs.',
                training_philosophy: 'I believe in sustainable, progressive training that builds both physical and mental strength. Every workout should challenge you while being safe and enjoyable.',
                achievements: 'Certified Personal Trainer for 8 years, Helped 50+ clients lose over 20lbs, Completed Iron Man Triathlon 2023',
                available_time: 'Monday-Friday: 6:00 AM - 8:00 PM, Saturday: 8:00 AM - 6:00 PM, Sunday: Rest day',
                facebook_url: 'https://facebook.com/johntrainer',
                instagram_url: 'https://instagram.com/johnfitness',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 2,
                trainer_id: 2,
                certificate: 'RYT-500, NASM-CES',
                certificates_detail: 'Registered Yoga Teacher 500-hour, NASM Corrective Exercise Specialist',
                education: 'Bachelor of Arts in Dance, Master of Science in Health and Wellness',
                skills: 'Yoga Instruction, Flexibility Training, Corrective Exercise, Mindfulness, Stress Management',
                work_experience: '6 years teaching yoga and wellness coaching, experience with rehabilitation and corrective exercise',
                introduction: 'I\'m Sarah, a certified yoga instructor and wellness coach. I help clients find balance between physical fitness and mental well-being.',
                training_philosophy: 'Wellness is about harmony between mind, body, and spirit. I focus on holistic approaches that promote long-term health and happiness.',
                achievements: 'RYT-500 Certified, 1000+ yoga classes taught, Featured wellness blogger, Completed advanced meditation teacher training',
                available_time: 'Monday-Saturday: 7:00 AM - 7:00 PM, Specializes in morning yoga sessions',
                facebook_url: 'https://facebook.com/sarahyoga',
                instagram_url: 'https://instagram.com/sarahwellness',
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);
        // Create trainer specializations
        await queryInterface.bulkInsert('trainer_specializations', [
            // John's specializations
            {
                id: 1,
                trainer_id: 1,
                specialization_id: 1, // Weight Loss
                created_at: new Date()
            },
            {
                id: 2,
                trainer_id: 1,
                specialization_id: 2, // Muscle Gain
                created_at: new Date()
            },
            {
                id: 3,
                trainer_id: 1,
                specialization_id: 7, // Nutrition Coaching
                created_at: new Date()
            },
            // Sarah's specializations
            {
                id: 4,
                trainer_id: 2,
                specialization_id: 4, // Yoga & Flexibility
                created_at: new Date()
            },
            {
                id: 5,
                trainer_id: 2,
                specialization_id: 6, // Rehabilitation
                created_at: new Date()
            },
            {
                id: 6,
                trainer_id: 2,
                specialization_id: 9, // Group Classes
                created_at: new Date()
            }
        ]);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('trainer_specializations', {});
        await queryInterface.bulkDelete('trainer_profiles', {});
        await queryInterface.bulkDelete('trainers', {});
    }
};
//# sourceMappingURL=005-trainers.js.map