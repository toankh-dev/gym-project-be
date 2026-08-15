'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        const today = new Date();
        const at = (dayOffset, hour, minute) => {
            const d = new Date();
            d.setDate(today.getDate() + dayOffset);
            d.setHours(hour, minute, 0, 0);
            return d;
        };
        // Schedule enrollments
        await queryInterface.bulkInsert('schedule_members', [
            {
                id: 1,
                schedule_id: 1, // Morning Strength Bootcamp
                member_id: 1,
                enrollment_date: at(-1, 10, 0),
                payment_status: 'PAID',
                attendance_status: 'REGISTERED',
                notes: 'First bootcamp session',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 2,
                schedule_id: 1,
                member_id: 3,
                enrollment_date: at(-1, 11, 0),
                payment_status: 'PAID',
                attendance_status: 'REGISTERED',
                notes: null,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 3,
                schedule_id: 2, // Evening Yoga Flow
                member_id: 2,
                enrollment_date: at(-1, 9, 0),
                payment_status: 'PAID',
                attendance_status: 'REGISTERED',
                notes: 'Prefers front of class',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 4,
                schedule_id: 3, // Personal Training - Weight Loss
                member_id: 1,
                enrollment_date: at(-2, 8, 0),
                payment_status: 'PAID',
                attendance_status: 'REGISTERED',
                notes: 'Focus on lower body',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 5,
                schedule_id: 4, // Flexibility Workshop (completed)
                member_id: 2,
                enrollment_date: at(-5, 12, 0),
                payment_status: 'PAID',
                attendance_status: 'ATTENDED',
                notes: 'Completed full workshop',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 6,
                schedule_id: 4,
                member_id: 3,
                enrollment_date: at(-5, 13, 0),
                payment_status: 'PAID',
                attendance_status: 'ABSENT',
                notes: 'Did not show up',
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);
        // Attendance logs (gym visits and sessions)
        await queryInterface.bulkInsert('attendance_logs', [
            {
                id: 1,
                member_id: 1,
                check_in_time: at(-5, 7, 5),
                check_out_time: at(-5, 8, 30),
                attendance_type: 'GYM_VISIT',
                schedule_id: null,
                trainer_id: null,
                check_in_method: 'CARD_SCAN',
                notes: 'Regular gym visit',
                recorded_by: 2,
                created_at: at(-5, 7, 5),
                updated_at: at(-5, 8, 30)
            },
            {
                id: 2,
                member_id: 2,
                check_in_time: at(-3, 15, 0),
                check_out_time: at(-3, 17, 0),
                attendance_type: 'GROUP_CLASS',
                schedule_id: 4,
                trainer_id: 2,
                check_in_method: 'QR_CODE',
                notes: 'Flexibility workshop attendance',
                recorded_by: 2,
                created_at: at(-3, 15, 0),
                updated_at: at(-3, 17, 0)
            },
            {
                id: 3,
                member_id: 1,
                check_in_time: at(-2, 8, 55),
                check_out_time: at(-2, 10, 5),
                attendance_type: 'TRAINING_SESSION',
                schedule_id: 3,
                trainer_id: 1,
                check_in_method: 'MOBILE_APP',
                notes: 'Personal training session',
                recorded_by: 1,
                created_at: at(-2, 8, 55),
                updated_at: at(-2, 10, 5)
            },
            {
                id: 4,
                member_id: 3,
                check_in_time: at(-1, 18, 0),
                check_out_time: at(-1, 19, 30),
                attendance_type: 'GYM_VISIT',
                schedule_id: null,
                trainer_id: null,
                check_in_method: 'CARD_SCAN',
                notes: 'Evening workout',
                recorded_by: 2,
                created_at: at(-1, 18, 0),
                updated_at: at(-1, 19, 30)
            },
            {
                id: 5,
                member_id: 1,
                check_in_time: at(0, 7, 0),
                check_out_time: null,
                attendance_type: 'GYM_VISIT',
                schedule_id: null,
                trainer_id: null,
                check_in_method: 'MOBILE_APP',
                notes: 'Currently checked in',
                recorded_by: 2,
                created_at: at(0, 7, 0),
                updated_at: at(0, 7, 0)
            }
        ]);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('attendance_logs', {});
        await queryInterface.bulkDelete('schedule_members', {});
    }
};
//# sourceMappingURL=012-schedule-members-attendance.js.map