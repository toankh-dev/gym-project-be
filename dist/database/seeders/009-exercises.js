'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('exercises', [
            {
                id: 1,
                name: 'Barbell Bench Press',
                category: 'STRENGTH',
                muscle_group: 'CHEST',
                equipment_needed: 'Barbell, Bench',
                difficulty_level: 'INTERMEDIATE',
                description: 'Compound pushing movement for chest, shoulders and triceps.',
                instructions: 'Lie on bench, grip barbell slightly wider than shoulders, lower to chest, press up.',
                safety_tips: 'Use a spotter for heavy loads. Keep wrists straight.',
                calories_per_minute: 8.0,
                is_active: true,
                created_by: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 2,
                name: 'Squat',
                category: 'STRENGTH',
                muscle_group: 'LEGS',
                equipment_needed: 'Barbell, Squat Rack',
                difficulty_level: 'INTERMEDIATE',
                description: 'Fundamental lower body compound movement.',
                instructions: 'Bar on upper back, descend until thighs parallel, drive up through heels.',
                safety_tips: 'Keep chest up and knees tracking over toes.',
                calories_per_minute: 9.0,
                is_active: true,
                created_by: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 3,
                name: 'Deadlift',
                category: 'STRENGTH',
                muscle_group: 'BACK',
                equipment_needed: 'Barbell',
                difficulty_level: 'ADVANCED',
                description: 'Full body pulling movement emphasizing posterior chain.',
                instructions: 'Hinge at hips, grip bar, drive through floor keeping back neutral.',
                safety_tips: 'Maintain a neutral spine. Do not round the lower back.',
                calories_per_minute: 10.0,
                is_active: true,
                created_by: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 4,
                name: 'Treadmill Run',
                category: 'CARDIO',
                muscle_group: 'FULL_BODY',
                equipment_needed: 'Treadmill',
                difficulty_level: 'BEGINNER',
                description: 'Steady-state or interval running for cardiovascular fitness.',
                instructions: 'Set speed and incline, maintain steady pace, cool down at the end.',
                safety_tips: 'Start slow and warm up. Stay hydrated.',
                calories_per_minute: 11.0,
                is_active: true,
                created_by: 3,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 5,
                name: 'Plank',
                category: 'FUNCTIONAL',
                muscle_group: 'CORE',
                equipment_needed: 'None',
                difficulty_level: 'BEGINNER',
                description: 'Isometric core stabilization exercise.',
                instructions: 'Hold a straight body line on forearms and toes, brace core.',
                safety_tips: 'Avoid sagging hips. Keep neck neutral.',
                calories_per_minute: 5.0,
                is_active: true,
                created_by: 3,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 6,
                name: 'Downward Dog',
                category: 'FLEXIBILITY',
                muscle_group: 'FULL_BODY',
                equipment_needed: 'Yoga Mat',
                difficulty_level: 'BEGINNER',
                description: 'Yoga pose improving flexibility and full-body stretch.',
                instructions: 'Form an inverted V, press heels toward floor, lengthen spine.',
                safety_tips: 'Keep weight evenly distributed between hands and feet.',
                calories_per_minute: 4.0,
                is_active: true,
                created_by: 4,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 7,
                name: 'Pull-Up',
                category: 'STRENGTH',
                muscle_group: 'BACK',
                equipment_needed: 'Pull-Up Bar',
                difficulty_level: 'ADVANCED',
                description: 'Bodyweight vertical pulling movement.',
                instructions: 'Hang from bar, pull chin over bar, lower under control.',
                safety_tips: 'Avoid swinging. Use assistance bands if needed.',
                calories_per_minute: 8.0,
                is_active: true,
                created_by: 3,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 8,
                name: 'Dumbbell Shoulder Press',
                category: 'STRENGTH',
                muscle_group: 'SHOULDERS',
                equipment_needed: 'Dumbbells',
                difficulty_level: 'INTERMEDIATE',
                description: 'Overhead pressing movement for shoulder development.',
                instructions: 'Press dumbbells overhead from shoulder height, lower under control.',
                safety_tips: 'Do not arch the lower back excessively.',
                calories_per_minute: 7.0,
                is_active: true,
                created_by: 1,
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('exercises', {});
    }
};
//# sourceMappingURL=009-exercises.js.map