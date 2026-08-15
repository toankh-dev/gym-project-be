"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScheduleAnalyticsReport = exports.getTrainerPerformanceReport = exports.getAttendanceReport = exports.getMembershipReport = exports.getRevenueReport = void 0;
const sequelize_1 = require("sequelize");
const Member_model_1 = require("@/models/Member.model");
const Trainer_model_1 = require("@/models/Trainer.model");
const Schedule_model_1 = require("@/models/Schedule.model");
const Subscription_model_1 = require("@/models/Subscription.model");
const error_middleware_1 = require("@/middlewares/error.middleware");
function monthKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function lastNMonths(n) {
    const now = new Date();
    const arr = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        arr.push({ start: d, key: monthKey(d) });
    }
    return arr;
}
// Revenue report
exports.getRevenueReport = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const months = Math.max(1, Math.min(36, parseInt(String(req.query.months || '12'), 10)));
    const buckets = lastNMonths(months);
    const startWindow = buckets[0].start;
    const rows = await Subscription_model_1.MemberSubscription.findAll({
        where: {
            status: { [sequelize_1.Op.in]: ['ACTIVE', 'EXPIRED'] },
            created_at: { [sequelize_1.Op.gte]: startWindow },
        },
        attributes: [
            [(0, sequelize_1.fn)('YEAR', (0, sequelize_1.col)('created_at')), 'y'],
            [(0, sequelize_1.fn)('MONTH', (0, sequelize_1.col)('created_at')), 'm'],
            [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('actual_price')), 'revenue'],
            [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('MemberSubscription.id')), 'cnt'],
        ],
        group: [(0, sequelize_1.literal)('y'), (0, sequelize_1.literal)('m')],
        raw: true,
    });
    const map = new Map();
    rows.forEach((r) => {
        const key = `${r.y}-${String(r.m).padStart(2, '0')}`;
        map.set(key, { revenue: Number(r.revenue || 0), cnt: Number(r.cnt || 0) });
    });
    const monthly = buckets.map((b) => {
        const v = map.get(b.key);
        return { month: b.key, revenue: v?.revenue || 0, transactionCount: v?.cnt || 0 };
    });
    const byPackageRows = await Subscription_model_1.MemberSubscription.findAll({
        where: {
            status: { [sequelize_1.Op.in]: ['ACTIVE', 'EXPIRED'] },
            created_at: { [sequelize_1.Op.gte]: startWindow },
        },
        attributes: [
            'packageId',
            [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('actual_price')), 'totalRevenue'],
            [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('MemberSubscription.id')), 'subscriberCount'],
        ],
        include: [{ association: 'package', attributes: ['name'] }],
        group: ['packageId', 'package.id'],
        raw: true,
        nest: true,
    });
    const byPackage = byPackageRows
        .map((r) => ({
        packageName: r.package?.name || 'Unknown',
        totalRevenue: Number(r.totalRevenue || 0),
        subscriberCount: Number(r.subscriberCount || 0),
    }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue);
    res.json({ success: true, data: { monthly, byPackage } });
});
// Membership report
exports.getMembershipReport = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const months = Math.max(1, Math.min(36, parseInt(String(req.query.months || '12'), 10)));
    const buckets = lastNMonths(months);
    const startWindow = buckets[0].start;
    const newRows = await Member_model_1.Member.findAll({
        where: { created_at: { [sequelize_1.Op.gte]: startWindow } },
        attributes: [
            [(0, sequelize_1.fn)('YEAR', (0, sequelize_1.col)('created_at')), 'y'],
            [(0, sequelize_1.fn)('MONTH', (0, sequelize_1.col)('created_at')), 'm'],
            [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'cnt'],
        ],
        group: [(0, sequelize_1.literal)('y'), (0, sequelize_1.literal)('m')],
        raw: true,
    });
    const newMap = new Map();
    newRows.forEach((r) => {
        newMap.set(`${r.y}-${String(r.m).padStart(2, '0')}`, Number(r.cnt || 0));
    });
    const monthly = await Promise.all(buckets.map(async (b) => {
        const nextMonth = new Date(b.start.getFullYear(), b.start.getMonth() + 1, 1);
        const activeTotal = await Member_model_1.Member.count({
            where: { created_at: { [sequelize_1.Op.lt]: nextMonth } },
        });
        return {
            month: b.key,
            newMembers: newMap.get(b.key) || 0,
            activeTotal,
        };
    }));
    const statusRows = await Member_model_1.Member.findAll({
        attributes: ['membershipStatus', [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'cnt']],
        group: ['membershipStatus'],
        raw: true,
    });
    const statusDistribution = {
        ACTIVE: 0, EXPIRED: 0, SUSPENDED: 0, CANCELLED: 0,
    };
    statusRows.forEach((r) => {
        const key = r.membershipStatus;
        if (key in statusDistribution)
            statusDistribution[key] = Number(r.cnt || 0);
    });
    res.json({ success: true, data: { monthly, statusDistribution } });
});
// Attendance report
exports.getAttendanceReport = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const days = Math.max(1, Math.min(90, parseInt(String(req.query.days || '30'), 10)));
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startWindow = new Date(startOfToday);
    startWindow.setDate(startOfToday.getDate() - (days - 1));
    const rows = await Schedule_model_1.AttendanceLog.findAll({
        where: { checkinTime: { [sequelize_1.Op.gte]: startWindow } },
        attributes: [
            [(0, sequelize_1.fn)('DATE', (0, sequelize_1.col)('check_in_time')), 'd'],
            [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'cnt'],
        ],
        group: [(0, sequelize_1.literal)('d')],
        raw: true,
    });
    const map = new Map();
    rows.forEach((r) => {
        const date = r.d instanceof Date ? r.d.toISOString().split('T')[0] : String(r.d);
        map.set(date, Number(r.cnt || 0));
    });
    const daily = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(startWindow);
        d.setDate(startWindow.getDate() + i);
        const key = d.toISOString().split('T')[0];
        daily.push({ date: key, checkInCount: map.get(key) || 0 });
    }
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const regularRows = await Schedule_model_1.AttendanceLog.findAll({
        where: { checkinTime: { [sequelize_1.Op.gte]: monthStart } },
        attributes: ['memberId', [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'cnt']],
        group: ['memberId'],
        raw: true,
    });
    const regularCount = regularRows.filter((r) => Number(r.cnt || 0) >= 8).length;
    const totalActive = await Member_model_1.Member.count({ where: { membershipStatus: 'ACTIVE' } });
    const regularMemberRate = totalActive === 0 ? 0 : Math.round((regularCount / totalActive) * 1000) / 10;
    res.json({ success: true, data: { daily, regularMemberRate } });
});
// Trainer performance report
exports.getTrainerPerformanceReport = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
    const trainers = await Trainer_model_1.Trainer.findAll({
        include: [{ association: 'user', include: [{ association: 'profile' }] }],
        raw: true,
        nest: true,
    });
    const results = await Promise.all(trainers.map(async (t) => {
        const [totalSessions, assignedMembers] = await Promise.all([
            Schedule_model_1.TrainingSchedule.count({ where: { trainerId: t.id, status: 'COMPLETED' } }),
            Member_model_1.Member.count({ where: { assignedTrainerId: t.id } }),
        ]);
        return {
            trainerId: t.id,
            trainerName: t.user?.profile?.fullName || 'Unknown',
            totalSessions,
            assignedMembers,
            avgRating: Number(t.ratingAvg) || 0,
        };
    }));
    results.sort((a, b) => b.totalSessions - a.totalSessions);
    res.json({ success: true, data: { trainers: results } });
});
// Schedule analytics — utilization, attendance breakdown, status pie, peak hours
exports.getScheduleAnalyticsReport = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
    // 1) Utilization — fill rate per schedule + top by enrollment + top/bottom by fill rate
    const schedules = await Schedule_model_1.TrainingSchedule.findAll({
        attributes: ['id', 'className', 'classType', 'maxCapacity', 'currentEnrollment', 'status', 'startTime', 'dayOfWeek'],
        raw: true,
    });
    const withFillRate = schedules.map((s) => ({
        id: s.id,
        className: s.className,
        classType: s.classType,
        currentEnrollment: Number(s.currentEnrollment || 0),
        maxCapacity: Number(s.maxCapacity || 0),
        fillRate: s.maxCapacity > 0
            ? Math.round((Number(s.currentEnrollment) / Number(s.maxCapacity)) * 1000) / 10
            : 0,
    }));
    const totalCapacity = withFillRate.reduce((s, x) => s + x.maxCapacity, 0);
    const totalEnrollment = withFillRate.reduce((s, x) => s + x.currentEnrollment, 0);
    const avgFillRate = totalCapacity === 0
        ? 0
        : Math.round((totalEnrollment / totalCapacity) * 1000) / 10;
    const topByEnrollment = [...withFillRate]
        .sort((a, b) => b.currentEnrollment - a.currentEnrollment)
        .slice(0, 10);
    // 2) Attendance breakdown by class type — ATTENDED vs ABSENT vs REGISTERED
    const breakdownRows = await Schedule_model_1.ScheduleMember.findAll({
        attributes: [
            [(0, sequelize_1.literal)('`schedule`.`class_type`'), 'classType'],
            [(0, sequelize_1.literal)('`ScheduleMember`.`attendance_status`'), 'attendanceStatus'],
            [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('ScheduleMember.id')), 'cnt'],
        ],
        include: [
            {
                association: 'schedule',
                attributes: [],
                required: true,
            },
        ],
        group: [(0, sequelize_1.literal)('`schedule`.`class_type`'), (0, sequelize_1.literal)('`ScheduleMember`.`attendance_status`')],
        raw: true,
    });
    const breakdownMap = new Map();
    breakdownRows.forEach((r) => {
        const type = r.classType || 'UNKNOWN';
        if (!breakdownMap.has(type)) {
            breakdownMap.set(type, { ATTENDED: 0, ABSENT: 0, REGISTERED: 0, CANCELLED: 0 });
        }
        const bucket = breakdownMap.get(type);
        const status = r.attendanceStatus;
        if (status in bucket)
            bucket[status] = Number(r.cnt || 0);
    });
    const attendanceByType = Array.from(breakdownMap.entries()).map(([classType, counts]) => ({
        classType,
        ...counts,
    }));
    // 3) Status distribution pie
    const statusRows = await Schedule_model_1.TrainingSchedule.findAll({
        attributes: ['status', [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'cnt']],
        group: ['status'],
        raw: true,
    });
    const statusDistribution = {
        SCHEDULED: 0, ONGOING: 0, COMPLETED: 0, CANCELLED: 0,
    };
    statusRows.forEach((r) => {
        const key = r.status;
        if (key in statusDistribution)
            statusDistribution[key] = Number(r.cnt || 0);
    });
    // 4) Peak hours heatmap — day_of_week x hour bucket from start_time
    const peakRows = await Schedule_model_1.TrainingSchedule.findAll({
        attributes: [
            'dayOfWeek',
            [(0, sequelize_1.fn)('HOUR', (0, sequelize_1.col)('start_time')), 'hour'],
            [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'cnt'],
        ],
        group: ['dayOfWeek', (0, sequelize_1.literal)('HOUR(`TrainingSchedule`.`start_time`)')],
        raw: true,
    });
    const peakHours = peakRows.map((r) => ({
        dayOfWeek: r.dayOfWeek,
        hour: Number(r.hour),
        count: Number(r.cnt || 0),
    }));
    res.json({
        success: true,
        data: {
            utilization: {
                avgFillRate,
                totalSchedules: withFillRate.length,
                totalEnrollment,
                totalCapacity,
                topByEnrollment,
            },
            attendanceByType,
            statusDistribution,
            peakHours,
        },
    });
});
//# sourceMappingURL=report.controller.js.map