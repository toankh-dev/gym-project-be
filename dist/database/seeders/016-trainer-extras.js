'use strict';
// Bonus seed for the trainer-facing pages:
// - 15 workout plans (10 for trainer 1 / John, 5 for trainer 2 / Sarah),
//   each with 6-12 exercises scattered across the week.
// - Future schedule_members enrollments (status REGISTERED) so the
//   "Member Sessions" tab and trainer schedules show real upcoming
//   registrations, not only past ATTENDED/ABSENT rows.
// - Adds session notes onto a handful of existing ATTENDED rows so the
//   data feels lived-in.
//
// All ids start at 5000+ to keep this seed independently undo-able.
const PLAN_BASE_ID = 5000;
const PLAN_EXERCISE_BASE_ID = 5000;
const SCHEDULE_MEMBER_BASE_ID = 5000;
const PLAN_GOALS = ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'ENDURANCE', 'STRENGTH', 'GENERAL_FITNESS', 'REHABILITATION'];
const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const STATUSES = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'DRAFT', 'COMPLETED', 'PAUSED']; // weighted toward ACTIVE
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const ATTENDANCE_NOTES = [
    'Great form on compound lifts.',
    'Member fatigued late in session, recommend rest day.',
    'Hit a new PR — celebrate next week.',
    'Mobility limited; add warm-up.',
    'Strong cardio block, push next session.',
    'Focused well on technique.',
    'Slight discomfort in lower back; modify squat.',
];
let rngState = 7;
function rand() {
    rngState = (rngState * 1664525 + 1013904223) % 4294967296;
    return rngState / 4294967296;
}
function randInt(min, max) {
    return Math.floor(rand() * (max - min + 1)) + min;
}
function pick(arr) {
    return arr[Math.floor(rand() * arr.length)];
}
function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}
function ymd(date) {
    return date.toISOString().split('T')[0];
}
module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();
        // Pull live ids so we don't hard-code anything that depends on prior seeds.
        const [exerciseRows] = await queryInterface.sequelize.query('SELECT id FROM exercises');
        const exerciseIds = exerciseRows.map((r) => r.id);
        if (exerciseIds.length === 0) {
            throw new Error('No exercises found — run earlier seeders first.');
        }
        const [memberRows] = await queryInterface.sequelize.query('SELECT id, assigned_trainer_id FROM members WHERE assigned_trainer_id IN (1, 2)');
        const membersByTrainer = { 1: [], 2: [] };
        memberRows.forEach((m) => {
            if (membersByTrainer[m.assigned_trainer_id]) {
                membersByTrainer[m.assigned_trainer_id].push(m.id);
            }
        });
        if (membersByTrainer[1].length === 0 || membersByTrainer[2].length === 0) {
            throw new Error('Need at least one assigned member per trainer — check member seed.');
        }
        // ---------- Workout plans ------------------------------------
        const plans = [];
        const planExercises = [];
        let planId = PLAN_BASE_ID;
        let planExId = PLAN_EXERCISE_BASE_ID;
        function makePlansForTrainer(trainerId, count) {
            for (let i = 0; i < count; i++) {
                const memberPool = membersByTrainer[trainerId];
                const memberId = pick(memberPool);
                const durationWeeks = pick([4, 6, 8, 12]);
                const startOffsetDays = randInt(-30, 14);
                const startDate = addDays(now, startOffsetDays);
                const endDate = addDays(startDate, durationWeeks * 7);
                const status = pick(STATUSES);
                plans.push({
                    id: planId++,
                    member_id: memberId,
                    trainer_id: trainerId,
                    plan_name: `${pick(['Power', 'Strength', 'Endurance', 'Conditioning', 'Foundations', 'Hybrid'])} ${durationWeeks}w #${i + 1}`,
                    description: 'Trainer-designed plan with progressive overload.',
                    goal: pick(PLAN_GOALS),
                    difficulty_level: pick(LEVELS),
                    duration_weeks: durationWeeks,
                    sessions_per_week: randInt(3, 5),
                    start_date: ymd(startDate),
                    end_date: ymd(endDate),
                    status,
                    notes: rand() < 0.4 ? 'Adjust based on member feedback weekly.' : null,
                    created_at: startDate,
                    updated_at: startDate,
                });
            }
        }
        makePlansForTrainer(1, 10);
        makePlansForTrainer(2, 5);
        // For each plan, scatter 6-12 exercises across MONDAY..FRIDAY mostly,
        // with the occasional SATURDAY/SUNDAY row.
        for (const plan of plans) {
            const exCount = randInt(6, 12);
            const usedDayOrders = new Map(); // dayOfWeek -> next exerciseOrder
            for (let i = 0; i < exCount; i++) {
                const day = pick(DAYS.slice(0, 5).concat(rand() < 0.3 ? ['SATURDAY', 'SUNDAY'] : []));
                const orderForDay = (usedDayOrders.get(day) || 0) + 1;
                usedDayOrders.set(day, orderForDay);
                planExercises.push({
                    id: planExId++,
                    workout_plan_id: plan.id,
                    exercise_id: pick(exerciseIds),
                    day_of_week: day,
                    exercise_order: orderForDay,
                    sets: pick([3, 4, 5]),
                    reps: pick(['8-12', '10', '12', '15', 'AMRAP', '5x5']),
                    weight_kg: rand() < 0.6 ? randInt(20, 100) : null,
                    duration_minutes: rand() < 0.2 ? randInt(5, 20) : null,
                    rest_seconds: pick([60, 90, 120]),
                    notes: null,
                    created_at: plan.created_at,
                    updated_at: plan.created_at,
                });
            }
        }
        await queryInterface.bulkInsert('workout_plans', plans);
        await queryInterface.bulkInsert('workout_plan_exercises', planExercises);
        // ---------- Future schedule_members (REGISTERED) -------------
        const [futureSchedules] = await queryInterface.sequelize.query("SELECT id, trainer_id, max_capacity, current_enrollment, start_date FROM training_schedules WHERE start_date >= CURDATE() AND status='SCHEDULED'");
        // Look up existing (schedule_id, member_id) pairs so we don't violate
        // the schedule_members.uq_schedule_member unique constraint.
        const [existingPairs] = await queryInterface.sequelize.query('SELECT schedule_id, member_id FROM schedule_members');
        const existing = new Set(existingPairs.map((p) => `${p.schedule_id}-${p.member_id}`));
        const futureEnrollments = [];
        let smId = SCHEDULE_MEMBER_BASE_ID;
        for (const sched of futureSchedules) {
            const trainerId = sched.trainer_id;
            const pool = membersByTrainer[trainerId] || [];
            if (pool.length === 0)
                continue;
            const capacityLeft = Math.max(1, (sched.max_capacity || 10) - (sched.current_enrollment || 0));
            const targetCount = Math.min(randInt(2, 6), capacityLeft, pool.length);
            const picked = new Set();
            let tries = 0;
            while (picked.size < targetCount && tries < pool.length * 3) {
                const candidate = pick(pool);
                const key = `${sched.id}-${candidate}`;
                if (!existing.has(key) && !picked.has(candidate)) {
                    picked.add(candidate);
                    existing.add(key);
                }
                tries++;
            }
            for (const memberId of picked) {
                futureEnrollments.push({
                    id: smId++,
                    schedule_id: sched.id,
                    member_id: memberId,
                    enrollment_date: addDays(new Date(sched.start_date), -randInt(1, 10)),
                    payment_status: 'PAID',
                    attendance_status: 'REGISTERED',
                    notes: null,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }
        }
        if (futureEnrollments.length > 0) {
            await queryInterface.bulkInsert('schedule_members', futureEnrollments);
        }
        // ---------- Sprinkle notes onto existing ATTENDED rows --------
        // Only touch rows the earlier demo seed inserted (id >= 1000), so we
        // can undo cleanly. Use a SQL UPDATE with conditional notes per row.
        const [attendedRows] = await queryInterface.sequelize.query("SELECT id FROM schedule_members WHERE attendance_status='ATTENDED' AND id >= 1000 AND id < 5000 AND notes IS NULL ORDER BY id LIMIT 80");
        for (const row of attendedRows) {
            const note = pick(ATTENDANCE_NOTES).replace(/'/g, "''");
            await queryInterface.sequelize.query(`UPDATE schedule_members SET notes = '${note}' WHERE id = ${row.id}`);
        }
    },
    async down(queryInterface, Sequelize) {
        const { Op } = Sequelize;
        // Remove rows we inserted
        await queryInterface.bulkDelete('schedule_members', { id: { [Op.gte]: SCHEDULE_MEMBER_BASE_ID } });
        await queryInterface.bulkDelete('workout_plan_exercises', { id: { [Op.gte]: PLAN_EXERCISE_BASE_ID } });
        await queryInterface.bulkDelete('workout_plans', { id: { [Op.gte]: PLAN_BASE_ID } });
        // Clear notes we added on existing ATTENDED rows (we set them to non-null).
        // Anything in [1000,5000) was created by 015-demo-data with notes NULL, so
        // resetting only those is safe.
        await queryInterface.sequelize.query("UPDATE schedule_members SET notes = NULL WHERE attendance_status='ATTENDED' AND id >= 1000 AND id < 5000");
    },
};
//# sourceMappingURL=016-trainer-extras.js.map