'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        const today = new Date();
        const dateOffset = (n) => {
            const d = new Date();
            d.setDate(today.getDate() - n);
            return d.toISOString().split('T')[0];
        };
        await queryInterface.bulkInsert('workout_progress_logs', [
            // Member 1 logs
            {
                id: 1,
                member_id: 1,
                workout_plan_id: null,
                exercise_id: 1, // Bench Press
                workout_date: dateOffset(7),
                sets_completed: 4,
                reps_completed: 10,
                weight_used_kg: 40.0,
                duration_minutes: 20,
                calories_burned: 160,
                difficulty_rating: '3',
                notes: 'Felt strong today',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 2,
                member_id: 1,
                workout_plan_id: null,
                exercise_id: 2, // Squat
                workout_date: dateOffset(5),
                sets_completed: 5,
                reps_completed: 8,
                weight_used_kg: 60.0,
                duration_minutes: 25,
                calories_burned: 225,
                difficulty_rating: '4',
                notes: 'Increased weight',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 3,
                member_id: 1,
                workout_plan_id: null,
                exercise_id: 4, // Treadmill
                workout_date: dateOffset(2),
                sets_completed: 1,
                reps_completed: null,
                weight_used_kg: null,
                duration_minutes: 30,
                calories_burned: 330,
                difficulty_rating: '2',
                notes: 'Steady cardio',
                created_at: new Date(),
                updated_at: new Date()
            },
            // Member 2 logs
            {
                id: 4,
                member_id: 2,
                workout_plan_id: null,
                exercise_id: 6, // Downward Dog
                workout_date: dateOffset(4),
                sets_completed: 3,
                reps_completed: null,
                weight_used_kg: null,
                duration_minutes: 40,
                calories_burned: 160,
                difficulty_rating: '2',
                notes: 'Morning yoga flow',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 5,
                member_id: 2,
                workout_plan_id: null,
                exercise_id: 5, // Plank
                workout_date: dateOffset(1),
                sets_completed: 3,
                reps_completed: 1,
                weight_used_kg: null,
                duration_minutes: 10,
                calories_burned: 50,
                difficulty_rating: '3',
                notes: 'Core day',
                created_at: new Date(),
                updated_at: new Date()
            },
            // Member 3 logs
            {
                id: 6,
                member_id: 3,
                workout_plan_id: null,
                exercise_id: 3, // Deadlift
                workout_date: dateOffset(3),
                sets_completed: 4,
                reps_completed: 6,
                weight_used_kg: 70.0,
                duration_minutes: 22,
                calories_burned: 220,
                difficulty_rating: '4',
                notes: 'Heavy pull day',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 7,
                member_id: 3,
                workout_plan_id: null,
                exercise_id: 7, // Pull-Up
                workout_date: dateOffset(1),
                sets_completed: 3,
                reps_completed: 8,
                weight_used_kg: null,
                duration_minutes: 15,
                calories_burned: 120,
                difficulty_rating: '5',
                notes: 'Bodyweight strength',
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('workout_progress_logs', {});
    }
};
//# sourceMappingURL=013-workout-progress-logs.js.map