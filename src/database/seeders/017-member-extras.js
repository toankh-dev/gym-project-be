'use strict';

// Bonus seed for member-facing pages.
// All ids start at 7000 to keep this seed undo-able.

const LOG_BASE_ID = 7000;
const SUB_BASE_ID = 7000;
const PAYMENT_BASE_ID = 7000;

const METHODS = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'E_WALLET'];

let rngState = 99;
function rand() { rngState = (rngState * 1664525 + 1013904223) % 4294967296; return rngState / 4294967296; }
function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function ymd(date) { return date.toISOString().split('T')[0]; }

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const [exRows] = await queryInterface.sequelize.query('SELECT id FROM exercises');
    const exerciseIds = exRows.map((r) => r.id);
    if (exerciseIds.length === 0) {
      throw new Error('No exercises found; run earlier seeders first.');
    }

    const [memberRows] = await queryInterface.sequelize.query(
      'SELECT id FROM members WHERE id IN (1, 2, 3) OR id BETWEEN 1000 AND 1099'
    );
    const memberIds = memberRows.map((r) => r.id);

    const [packageRows] = await queryInterface.sequelize.query(
      'SELECT id, price, duration_months FROM membership_packages WHERE status = "ACTIVE"'
    );

    // Workout progress logs
    const logs = [];
    let logId = LOG_BASE_ID;
    for (let i = 0; i < 150; i++) {
      const daysAgo = randInt(0, 59);
      const workoutDate = addDays(now, -daysAgo);
      const member = pick(memberIds);
      const exercise = pick(exerciseIds);
      logs.push({
        id: logId++,
        member_id: member,
        workout_plan_id: null,
        exercise_id: exercise,
        workout_date: ymd(workoutDate),
        sets_completed: randInt(3, 5),
        reps_completed: randInt(8, 15),
        weight_used_kg: rand() < 0.7 ? randInt(10, 80) : null,
        duration_minutes: rand() < 0.4 ? randInt(15, 60) : null,
        calories_burned: rand() < 0.5 ? randInt(80, 350) : null,
        difficulty_rating: pick(['2', '3', '4', '5']),
        notes: null,
        created_at: workoutDate,
        updated_at: workoutDate,
      });
    }
    await queryInterface.bulkInsert('workout_progress_logs', logs);

    // Extra subscriptions
    const subs = [];
    let subId = SUB_BASE_ID;

    for (let i = 0; i < 6; i++) {
      const memberId = pick(memberIds);
      const pkg = pick(packageRows);
      const startDate = addDays(now, randInt(1, 21));
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + pkg.duration_months);
      subs.push({
        id: subId++,
        member_id: memberId,
        package_id: pkg.id,
        start_date: ymd(startDate),
        end_date: ymd(endDate),
        actual_price: pkg.price,
        status: 'PENDING',
        renewal_reminder_sent: false,
        renewal_reminder_sent_at: null,
        registered_by: null,
        created_at: now,
        updated_at: now,
      });
    }

    for (let i = 0; i < 8; i++) {
      const memberId = pick(memberIds);
      const pkg = pick(packageRows);
      const monthsAgo = randInt(8, 14);
      const startDate = addDays(now, -monthsAgo * 30);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + pkg.duration_months);
      subs.push({
        id: subId++,
        member_id: memberId,
        package_id: pkg.id,
        start_date: ymd(startDate),
        end_date: ymd(endDate),
        actual_price: pkg.price,
        status: 'EXPIRED',
        renewal_reminder_sent: true,
        renewal_reminder_sent_at: endDate,
        registered_by: null,
        created_at: startDate,
        updated_at: endDate,
      });
    }

    await queryInterface.bulkInsert('member_subscriptions', subs);

    // Payments
    const [allSubs] = await queryInterface.sequelize.query(
      'SELECT id, member_id, actual_price, created_at FROM member_subscriptions WHERE actual_price IS NOT NULL'
    );

    const payments = [];
    let payId = PAYMENT_BASE_ID;
    for (const s of allSubs) {
      if (rand() < 0.15) continue;
      payments.push({
        id: payId++,
        member_id: s.member_id,
        subscription_id: s.id,
        amount: s.actual_price,
        payment_method: pick(METHODS),
        payment_type: 'MEMBERSHIP_FEE',
        payment_date: s.created_at,
        payment_status: 'COMPLETED',
        transaction_reference: `TXN-${payId}`,
        notes: null,
        processed_by: null,
        created_at: s.created_at,
        updated_at: s.created_at,
      });
      if (payments.length >= 30) break;
    }
    if (payments.length > 0) {
      await queryInterface.bulkInsert('payments', payments);
    }
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete('payments', { id: { [Op.gte]: PAYMENT_BASE_ID } });
    await queryInterface.bulkDelete('member_subscriptions', { id: { [Op.gte]: SUB_BASE_ID } });
    await queryInterface.bulkDelete('workout_progress_logs', { id: { [Op.gte]: LOG_BASE_ID } });
  },
};
