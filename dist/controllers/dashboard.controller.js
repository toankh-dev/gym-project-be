"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = void 0;
const sequelize_1 = require("sequelize");
const Member_model_1 = require("@/models/Member.model");
const Trainer_model_1 = require("@/models/Trainer.model");
const Schedule_model_1 = require("@/models/Schedule.model");
const Subscription_model_1 = require("@/models/Subscription.model");
const error_middleware_1 = require("@/middlewares/error.middleware");
function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfPrevMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}
function growth(curr, prev) {
    if (prev === 0)
        return curr === 0 ? 0 : 100;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
}
exports.getDashboard = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const prevMonthStart = startOfPrevMonth(now);
    const todayStr = now.toISOString().split('T')[0];
    const [totalMembers, activeMembers, totalTrainers, activeTrainers, todaySessions] = await Promise.all([
        Member_model_1.Member.count(),
        Member_model_1.Member.count({ where: { membershipStatus: 'ACTIVE' } }),
        Trainer_model_1.Trainer.count(),
        Trainer_model_1.Trainer.count({ where: { status: 'ACTIVE' } }),
        Schedule_model_1.TrainingSchedule.count({ where: { startDate: todayStr } }),
    ]);
    const [monthlyRevenueRow, currMonthNew, prevMonthNew] = await Promise.all([
        Subscription_model_1.MemberSubscription.sum('actualPrice', {
            where: {
                status: { [sequelize_1.Op.in]: ['ACTIVE', 'EXPIRED'] },
                createdAt: { [sequelize_1.Op.gte]: monthStart },
            },
        }),
        Member_model_1.Member.count({ where: { created_at: { [sequelize_1.Op.gte]: monthStart } } }),
        Member_model_1.Member.count({
            where: { created_at: { [sequelize_1.Op.gte]: prevMonthStart, [sequelize_1.Op.lt]: monthStart } },
        }),
    ]);
    const monthlyRevenue = Number(monthlyRevenueRow || 0);
    const membershipGrowth = growth(currMonthNew, prevMonthNew);
    const [attended, totalRegistered] = await Promise.all([
        Schedule_model_1.ScheduleMember.count({
            where: { status: 'ATTENDED', registeredAt: { [sequelize_1.Op.gte]: monthStart } },
        }),
        Schedule_model_1.ScheduleMember.count({
            where: { registeredAt: { [sequelize_1.Op.gte]: monthStart } },
        }),
    ]);
    const attendanceRate = totalRegistered === 0 ? 0 : Math.round((attended / totalRegistered) * 100);
    const todaySchedulesRaw = await Schedule_model_1.TrainingSchedule.findAll({
        where: { startDate: todayStr },
        order: [['startTime', 'ASC']],
        include: [
            {
                association: 'trainer',
                include: [{ association: 'user', include: [{ association: 'profile' }] }],
            },
        ],
        raw: true,
        nest: true,
    });
    const todaySchedule = todaySchedulesRaw.map((s) => ({
        id: s.id,
        className: s.className,
        startTime: s.startTime,
        endTime: s.endTime,
        classType: s.classType,
        currentEnrollment: s.currentEnrollment,
        maxCapacity: s.maxCapacity,
        trainerName: s.trainer?.user?.profile?.fullName || 'Unassigned',
    }));
    // Recent activities — union of 4 sources
    const [recentMembers, recentSubs, recentSchedulesRaw, recentCheckins] = await Promise.all([
        Member_model_1.Member.findAll({
            limit: 5,
            order: [['created_at', 'DESC']],
            include: [{ association: 'user', include: [{ association: 'profile' }] }],
            raw: true,
            nest: true,
        }),
        Subscription_model_1.MemberSubscription.findAll({
            limit: 5,
            where: { status: { [sequelize_1.Op.in]: ['ACTIVE', 'EXPIRED'] } },
            order: [['created_at', 'DESC']],
            include: [
                {
                    association: 'member',
                    include: [{ association: 'user', include: [{ association: 'profile' }] }],
                },
            ],
            raw: true,
            nest: true,
        }),
        Schedule_model_1.TrainingSchedule.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    association: 'trainer',
                    include: [{ association: 'user', include: [{ association: 'profile' }] }],
                },
            ],
            raw: true,
            nest: true,
        }),
        Schedule_model_1.AttendanceLog.findAll({
            limit: 5,
            order: [[(0, sequelize_1.literal)('`AttendanceLog`.`check_in_time`'), 'DESC']],
            include: [
                {
                    association: 'member',
                    include: [{ association: 'user', include: [{ association: 'profile' }] }],
                },
            ],
            raw: true,
            nest: true,
        }),
    ]);
    const activities = [
        ...recentMembers.map((m) => ({
            id: `member-${m.id}`,
            type: 'MEMBER_REGISTERED',
            actorName: m.user?.profile?.fullName || 'Unknown',
            description: 'New member registered',
            createdAt: m.createdAt || m.created_at,
        })),
        ...recentSubs.map((s) => ({
            id: `payment-${s.id}`,
            type: 'PAYMENT',
            actorName: s.member?.user?.profile?.fullName || 'Unknown',
            description: `Payment ${Number(s.actualPrice).toLocaleString('vi-VN')} VND`,
            createdAt: s.createdAt || s.created_at,
        })),
        ...recentSchedulesRaw.map((s) => ({
            id: `schedule-${s.id}`,
            type: 'SCHEDULE_CREATED',
            actorName: s.trainer?.user?.profile?.fullName || 'Unknown',
            description: `Created schedule "${s.className}"`,
            createdAt: s.createdAt,
        })),
        ...recentCheckins.map((c) => ({
            id: `checkin-${c.id}`,
            type: 'CHECK_IN',
            actorName: c.member?.user?.profile?.fullName || 'Unknown',
            description: 'Checked in',
            createdAt: c.checkinTime,
        })),
    ];
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentActivities = activities.slice(0, 10);
    // Quick stats
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - 6);
    async function countByDateField(Model, field, extra = {}) {
        const [today, week, month, prevMonth] = await Promise.all([
            Model.count({ where: { ...extra, [field]: { [sequelize_1.Op.gte]: startOfToday } } }),
            Model.count({ where: { ...extra, [field]: { [sequelize_1.Op.gte]: startOfWeek } } }),
            Model.count({ where: { ...extra, [field]: { [sequelize_1.Op.gte]: monthStart } } }),
            Model.count({
                where: { ...extra, [field]: { [sequelize_1.Op.gte]: prevMonthStart, [sequelize_1.Op.lt]: monthStart } },
            }),
        ]);
        return { today, week, month, growth: growth(month, prevMonth) };
    }
    async function sumByDateField(Model, field, sumField, extra = {}) {
        const [today, week, month, prevMonth] = await Promise.all([
            Model.sum(sumField, { where: { ...extra, [field]: { [sequelize_1.Op.gte]: startOfToday } } }),
            Model.sum(sumField, { where: { ...extra, [field]: { [sequelize_1.Op.gte]: startOfWeek } } }),
            Model.sum(sumField, { where: { ...extra, [field]: { [sequelize_1.Op.gte]: monthStart } } }),
            Model.sum(sumField, {
                where: { ...extra, [field]: { [sequelize_1.Op.gte]: prevMonthStart, [sequelize_1.Op.lt]: monthStart } },
            }),
        ]);
        const m = Number(month || 0);
        const p = Number(prevMonth || 0);
        return {
            today: Number(today || 0),
            week: Number(week || 0),
            month: m,
            growth: growth(m, p),
        };
    }
    const [qsCheckIns, qsRegistrations, qsClasses, qsRevenue] = await Promise.all([
        countByDateField(Schedule_model_1.AttendanceLog, 'check_in_time'),
        countByDateField(Member_model_1.Member, 'created_at'),
        countByDateField(Schedule_model_1.TrainingSchedule, 'startDate', { status: 'COMPLETED' }),
        sumByDateField(Subscription_model_1.MemberSubscription, 'created_at', 'actualPrice', {
            status: { [sequelize_1.Op.in]: ['ACTIVE', 'EXPIRED'] },
        }),
    ]);
    const quickStats = {
        checkIns: qsCheckIns,
        registrations: qsRegistrations,
        classes: qsClasses,
        revenue: qsRevenue,
    };
    res.json({
        success: true,
        data: {
            stats: {
                totalMembers, activeMembers,
                totalTrainers, activeTrainers,
                todaySessions, monthlyRevenue,
                membershipGrowth, attendanceRate,
            },
            todaySchedule,
            recentActivities,
            quickStats,
        },
    });
});
//# sourceMappingURL=dashboard.controller.js.map