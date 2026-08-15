'use strict';

// Heavier demo seed: spreads 50 members, 120 subscriptions, 80 completed
// schedules, and ~500 attendance logs across the last 18 months so that
// the admin Dashboard and Reports charts show realistic, varied data.
//
// Idempotency: down() removes only the rows this seeder created (ids
// chosen to live above the ranges used by the earlier seeders).

const bcrypt = require('bcryptjs');

// ----- ID ranges this seeder owns ---------------------------------
// Existing seeds use users.id 1..7, members.id 1..3, schedule_members
// up to ~6, attendance_logs up to ~5, training_schedules up to ~5,
// member_subscriptions up to ~5. We start everything at 1000 to avoid
// collisions and make rollback trivial.
const USER_BASE_ID = 1000;
const PROFILE_BASE_ID = 1000;
const MEMBER_BASE_ID = 1000;
const SUBSCRIPTION_BASE_ID = 1000;
const SCHEDULE_BASE_ID = 1000;
const SCHEDULE_MEMBER_BASE_ID = 1000;
const ATTENDANCE_BASE_ID = 1000;

const MEMBER_ROLE_ID = 4;
const TRAINER_IDS = [1, 2];
const PACKAGES = [
  { id: 1, price: 500000,  durationMonths: 1 },
  { id: 2, price: 1350000, durationMonths: 3 },
  { id: 3, price: 2400000, durationMonths: 6 },
  { id: 4, price: 4200000, durationMonths: 12 },
  { id: 5, price: 1200000, durationMonths: 1 },
  { id: 6, price: 3200000, durationMonths: 3 },
  { id: 7, price: 300000,  durationMonths: 1 },
  { id: 8, price: 3600000, durationMonths: 12 },
];

// Deterministic pseudo-random so reruns produce the same dataset.
let rngState = 42;
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
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
function ymd(date) {
  return date.toISOString().split('T')[0];
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const NUM_MEMBERS = 50;
    const NUM_SUBSCRIPTIONS = 120;
    const NUM_COMPLETED_SCHEDULES = 80;
    const NUM_ATTENDANCE = 500;
    const MONTH_SPAN = 18;

    const now = new Date();
    const passwordHash = await bcrypt.hash('password', 12);

    // ---------- Users + UserProfiles + Members --------------------
    const users = [];
    const profiles = [];
    const members = [];

    const firstNames = ['An','Bao','Chi','Duy','Em','Phong','Giang','Hai','Khanh','Linh','Minh','Ngoc','Phuc','Quang','Son','Thao','Uyen','Vy','Yen','Tien'];
    const lastNames  = ['Nguyen','Tran','Le','Pham','Hoang','Vu','Do','Bui','Dang','Phan','Vo','Dinh','Truong','Ngo','Ly','Ha'];

    for (let i = 0; i < NUM_MEMBERS; i++) {
      const id = USER_BASE_ID + i;
      // Spread joinDate across the last MONTH_SPAN months, but guarantee
      // at least 15% of new members fall in the current month so the
      // dashboard's "New This Month" / "+X% growth" cards aren't empty.
      const forceCurrentMonth = i < Math.ceil(NUM_MEMBERS * 0.15);
      const monthsAgo = forceCurrentMonth ? 0 : randInt(0, MONTH_SPAN - 1);
      const dayOffsetMax = forceCurrentMonth ? Math.max(0, now.getDate() - 1) : 27;
      const joinDate = addDays(addMonths(now, -monthsAgo), -randInt(0, dayOffsetMax));
      const fullName = `${pick(lastNames)} ${pick(firstNames)} ${i + 1}`;

      users.push({
        id,
        role_id: MEMBER_ROLE_ID,
        username: `demo_member_${i + 1}`,
        email: `demo_member_${i + 1}@gym.com`,
        password_hash: passwordHash,
        phone: `09${String(10000000 + i).slice(-8)}`,
        status: 'ACTIVE',
        last_login_at: null,
        created_at: joinDate,
        updated_at: joinDate,
        deleted_at: null,
      });

      profiles.push({
        id: PROFILE_BASE_ID + i,
        user_id: id,
        full_name: fullName,
        gender: pick(['MALE', 'FEMALE', 'OTHER']),
        date_of_birth: ymd(addDays(now, -randInt(18, 60) * 365)),
        avatar_url: null,
        address: `Quan ${randInt(1, 12)}, TP HCM`,
        bio: null,
        created_at: joinDate,
        updated_at: joinDate,
        deleted_at: null,
      });

      // 70% ACTIVE, 15% EXPIRED, 10% SUSPENDED, 5% CANCELLED
      const r = rand();
      const membershipStatus =
        r < 0.7 ? 'ACTIVE' :
        r < 0.85 ? 'EXPIRED' :
        r < 0.95 ? 'SUSPENDED' : 'CANCELLED';

      members.push({
        id: MEMBER_BASE_ID + i,
        user_id: id,
        member_code: `M${String(USER_BASE_ID + i).padStart(6, '0')}`,
        join_date: ymd(joinDate),
        membership_status: membershipStatus,
        current_subscription_id: null,
        assigned_trainer_id: rand() < 0.5 ? pick(TRAINER_IDS) : null,
        note: null,
        created_at: joinDate,
        updated_at: joinDate,
        deleted_at: null,
      });
    }

    await queryInterface.bulkInsert('users', users);
    await queryInterface.bulkInsert('user_profiles', profiles);
    await queryInterface.bulkInsert('members', members);

    // ---------- MemberSubscriptions -------------------------------
    // Spread purchases across the last MONTH_SPAN months. Each
    // subscription's createdAt is the purchase date (= start_date).
    const subscriptions = [];
    for (let i = 0; i < NUM_SUBSCRIPTIONS; i++) {
      const member = pick(members);
      const pkg = pick(PACKAGES);

      // Bias purchases toward more recent months (charts look livelier).
      const monthsAgo = Math.floor(Math.pow(rand(), 1.5) * MONTH_SPAN);
      const startDate = addDays(addMonths(now, -monthsAgo), -randInt(0, 27));
      // Clamp so we don't go before member's join date.
      const memberJoin = new Date(member.join_date);
      const actualStart = startDate < memberJoin ? memberJoin : startDate;
      const endDate = addMonths(actualStart, pkg.durationMonths);

      // Most paid sales become ACTIVE/EXPIRED (counts as revenue).
      const status = endDate < now ? 'EXPIRED' : 'ACTIVE';

      subscriptions.push({
        id: SUBSCRIPTION_BASE_ID + i,
        member_id: member.id,
        package_id: pkg.id,
        start_date: ymd(actualStart),
        end_date: ymd(endDate),
        actual_price: pkg.price,
        status,
        renewal_reminder_sent: false,
        renewal_reminder_sent_at: null,
        registered_by: null,
        created_at: actualStart,
        updated_at: actualStart,
      });
    }
    await queryInterface.bulkInsert('member_subscriptions', subscriptions);

    // ---------- Training Schedules (COMPLETED for the past) -------
    const schedules = [];
    const classNames = ['HIIT Burn', 'Power Yoga', 'Spin Class', 'CrossFit Open Gym',
      'Pilates Core', 'Boxing Basics', 'Functional Strength', 'Body Pump',
      'Zumba Latin', 'Mobility Flow'];

    for (let i = 0; i < NUM_COMPLETED_SCHEDULES; i++) {
      // Spread across the last MONTH_SPAN months
      const monthsAgo = randInt(0, MONTH_SPAN - 1);
      const startDate = addDays(addMonths(now, -monthsAgo), -randInt(0, 27));

      const startHour = pick([6, 7, 8, 17, 18, 19]);
      const trainerId = pick(TRAINER_IDS);

      schedules.push({
        id: SCHEDULE_BASE_ID + i,
        class_name: `${pick(classNames)} #${i + 1}`,
        trainer_id: trainerId,
        class_type: pick(['GROUP_CLASS', 'PERSONAL_TRAINING', 'WORKSHOP']),
        description: null,
        start_date: ymd(startDate),
        end_date: ymd(startDate),
        start_time: `${String(startHour).padStart(2, '0')}:00:00`,
        end_time: `${String(startHour + 1).padStart(2, '0')}:00:00`,
        day_of_week: pick(['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']),
        max_capacity: randInt(10, 25),
        current_enrollment: randInt(5, 20),
        price_per_session: pick([100000, 150000, 200000]),
        location: pick(['Studio A', 'Studio B', 'Main Floor', 'Pool Deck']),
        status: 'COMPLETED',
        created_at: startDate,
        updated_at: startDate,
      });
    }
    await queryInterface.bulkInsert('training_schedules', schedules);

    // ---------- ScheduleMembers (some ATTENDED, some ABSENT) -------
    const scheduleMembers = [];
    let smId = SCHEDULE_MEMBER_BASE_ID;
    for (const sched of schedules) {
      const enrollCount = Math.min(randInt(3, 12), members.length);
      const enrolledIds = new Set();
      for (let i = 0; i < enrollCount; i++) {
        const m = pick(members);
        if (enrolledIds.has(m.id)) continue;
        enrolledIds.add(m.id);

        const enrollmentDate = addDays(new Date(sched.start_date), -randInt(1, 7));
        // 75% attended, 25% absent
        const status = rand() < 0.75 ? 'ATTENDED' : 'ABSENT';

        scheduleMembers.push({
          id: smId++,
          schedule_id: sched.id,
          member_id: m.id,
          enrollment_date: enrollmentDate,
          payment_status: 'PAID',
          attendance_status: status,
          notes: null,
          created_at: enrollmentDate,
          updated_at: enrollmentDate,
        });
      }
    }
    await queryInterface.bulkInsert('schedule_members', scheduleMembers);

    // ---------- AttendanceLogs (gym visits across 60 days) --------
    const attendance = [];
    const DAYS_BACK = 60;
    for (let i = 0; i < NUM_ATTENDANCE; i++) {
      const m = pick(members);
      // Bias toward recent days
      const daysAgo = Math.floor(Math.pow(rand(), 1.3) * DAYS_BACK);
      const hour = randInt(6, 21);
      const minute = randInt(0, 59);

      const checkin = addDays(now, -daysAgo);
      checkin.setHours(hour, minute, 0, 0);
      // Never let a generated check-in land in the future, otherwise the
      // "Recent Activities" feed shows negative relative times.
      if (checkin > now) checkin.setTime(now.getTime() - randInt(60, 3600) * 1000);
      const checkout = new Date(checkin.getTime() + randInt(30, 120) * 60 * 1000);

      attendance.push({
        id: ATTENDANCE_BASE_ID + i,
        member_id: m.id,
        check_in_time: checkin,
        check_out_time: checkout,
        attendance_type: 'GYM_VISIT',
        schedule_id: null,
        trainer_id: null,
        check_in_method: pick(['CARD_SCAN', 'QR_CODE', 'MANUAL', 'MOBILE_APP']),
        notes: null,
        recorded_by: null,
        created_at: checkin,
        updated_at: checkout,
      });
    }
    await queryInterface.bulkInsert('attendance_logs', attendance);
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete('attendance_logs', { id: { [Op.gte]: ATTENDANCE_BASE_ID } });
    await queryInterface.bulkDelete('schedule_members', { id: { [Op.gte]: SCHEDULE_MEMBER_BASE_ID } });
    await queryInterface.bulkDelete('training_schedules', { id: { [Op.gte]: SCHEDULE_BASE_ID } });
    await queryInterface.bulkDelete('member_subscriptions', { id: { [Op.gte]: SUBSCRIPTION_BASE_ID } });
    await queryInterface.bulkDelete('members', { id: { [Op.gte]: MEMBER_BASE_ID } });
    await queryInterface.bulkDelete('user_profiles', { id: { [Op.gte]: PROFILE_BASE_ID } });
    await queryInterface.bulkDelete('users', { id: { [Op.gte]: USER_BASE_ID } });
  },
};
