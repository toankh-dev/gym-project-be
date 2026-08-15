import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Member } from '@/models/Member.model';
import { Trainer } from '@/models/Trainer.model';
import { TrainingSchedule, AttendanceLog, ScheduleMember } from '@/models/Schedule.model';
import { MemberSubscription } from '@/models/Subscription.model';
import { asyncHandler } from '@/middlewares/error.middleware';

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function lastNMonths(n: number): { start: Date; key: string }[] {
  const now = new Date();
  const arr: { start: Date; key: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push({ start: d, key: monthKey(d) });
  }
  return arr;
}

// Revenue report
export const getRevenueReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const months = Math.max(1, Math.min(36, parseInt(String(req.query.months || '12'), 10)));
  const buckets = lastNMonths(months);
  const startWindow = buckets[0].start;

  const rows: any[] = await MemberSubscription.findAll({
    where: {
      status: { [Op.in]: ['ACTIVE', 'EXPIRED'] } as any,
      created_at: { [Op.gte]: startWindow } as any,
    } as any,
    attributes: [
      [fn('YEAR', col('created_at')), 'y'],
      [fn('MONTH', col('created_at')), 'm'],
      [fn('SUM', col('actual_price')), 'revenue'],
      [fn('COUNT', col('MemberSubscription.id')), 'cnt'],
    ],
    group: [literal('y'), literal('m')],
    raw: true,
  });

  const map = new Map<string, { revenue: number; cnt: number }>();
  rows.forEach((r: any) => {
    const key = `${r.y}-${String(r.m).padStart(2, '0')}`;
    map.set(key, { revenue: Number(r.revenue || 0), cnt: Number(r.cnt || 0) });
  });

  const monthly = buckets.map((b) => {
    const v = map.get(b.key);
    return { month: b.key, revenue: v?.revenue || 0, transactionCount: v?.cnt || 0 };
  });

  const byPackageRows: any[] = await MemberSubscription.findAll({
    where: {
      status: { [Op.in]: ['ACTIVE', 'EXPIRED'] } as any,
      created_at: { [Op.gte]: startWindow } as any,
    } as any,
    attributes: [
      'packageId',
      [fn('SUM', col('actual_price')), 'totalRevenue'],
      [fn('COUNT', col('MemberSubscription.id')), 'subscriberCount'],
    ],
    include: [{ association: 'package', attributes: ['name'] }],
    group: ['packageId', 'package.id'],
    raw: true,
    nest: true,
  });

  const byPackage = byPackageRows
    .map((r: any) => ({
      packageName: r.package?.name || 'Unknown',
      totalRevenue: Number(r.totalRevenue || 0),
      subscriberCount: Number(r.subscriberCount || 0),
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  res.json({ success: true, data: { monthly, byPackage } });
});

// Membership report
export const getMembershipReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const months = Math.max(1, Math.min(36, parseInt(String(req.query.months || '12'), 10)));
  const buckets = lastNMonths(months);
  const startWindow = buckets[0].start;

  const newRows: any[] = await Member.findAll({
    where: { created_at: { [Op.gte]: startWindow } as any } as any,
    attributes: [
      [fn('YEAR', col('created_at')), 'y'],
      [fn('MONTH', col('created_at')), 'm'],
      [fn('COUNT', col('id')), 'cnt'],
    ],
    group: [literal('y'), literal('m')],
    raw: true,
  });

  const newMap = new Map<string, number>();
  newRows.forEach((r: any) => {
    newMap.set(`${r.y}-${String(r.m).padStart(2, '0')}`, Number(r.cnt || 0));
  });

  const monthly = await Promise.all(
    buckets.map(async (b) => {
      const nextMonth = new Date(b.start.getFullYear(), b.start.getMonth() + 1, 1);
      const activeTotal = await Member.count({
        where: { created_at: { [Op.lt]: nextMonth } as any } as any,
      });
      return {
        month: b.key,
        newMembers: newMap.get(b.key) || 0,
        activeTotal,
      };
    }),
  );

  const statusRows: any[] = await Member.findAll({
    attributes: ['membershipStatus', [fn('COUNT', col('id')), 'cnt']],
    group: ['membershipStatus'],
    raw: true,
  });

  const statusDistribution: { ACTIVE: number; EXPIRED: number; SUSPENDED: number; CANCELLED: number } = {
    ACTIVE: 0, EXPIRED: 0, SUSPENDED: 0, CANCELLED: 0,
  };
  statusRows.forEach((r: any) => {
    const key = r.membershipStatus as keyof typeof statusDistribution;
    if (key in statusDistribution) statusDistribution[key] = Number(r.cnt || 0);
  });

  res.json({ success: true, data: { monthly, statusDistribution } });
});

// Attendance report
export const getAttendanceReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const days = Math.max(1, Math.min(90, parseInt(String(req.query.days || '30'), 10)));
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startWindow = new Date(startOfToday);
  startWindow.setDate(startOfToday.getDate() - (days - 1));

  const rows: any[] = await AttendanceLog.findAll({
    where: { checkinTime: { [Op.gte]: startWindow } as any },
    attributes: [
      [fn('DATE', col('check_in_time')), 'd'],
      [fn('COUNT', col('id')), 'cnt'],
    ],
    group: [literal('d')],
    raw: true,
  });

  const map = new Map<string, number>();
  rows.forEach((r: any) => {
    const date = r.d instanceof Date ? r.d.toISOString().split('T')[0] : String(r.d);
    map.set(date, Number(r.cnt || 0));
  });

  const daily: { date: string; checkInCount: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startWindow);
    d.setDate(startWindow.getDate() + i);
    const key = d.toISOString().split('T')[0];
    daily.push({ date: key, checkInCount: map.get(key) || 0 });
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const regularRows: any[] = await AttendanceLog.findAll({
    where: { checkinTime: { [Op.gte]: monthStart } as any },
    attributes: ['memberId', [fn('COUNT', col('id')), 'cnt']],
    group: ['memberId'],
    raw: true,
  });
  const regularCount = regularRows.filter((r: any) => Number(r.cnt || 0) >= 8).length;
  const totalActive = await Member.count({ where: { membershipStatus: 'ACTIVE' } });
  const regularMemberRate =
    totalActive === 0 ? 0 : Math.round((regularCount / totalActive) * 1000) / 10;

  res.json({ success: true, data: { daily, regularMemberRate } });
});

// Trainer performance report
export const getTrainerPerformanceReport = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const trainers: any[] = await Trainer.findAll({
      include: [{ association: 'user', include: [{ association: 'profile' }] }],
      raw: true,
      nest: true,
    });

    const results = await Promise.all(
      trainers.map(async (t: any) => {
        const [totalSessions, assignedMembers] = await Promise.all([
          TrainingSchedule.count({ where: { trainerId: t.id, status: 'COMPLETED' } }),
          Member.count({ where: { assignedTrainerId: t.id } }),
        ]);
        return {
          trainerId: t.id,
          trainerName: t.user?.profile?.fullName || 'Unknown',
          totalSessions,
          assignedMembers,
          avgRating: Number(t.ratingAvg) || 0,
        };
      }),
    );

    results.sort((a, b) => b.totalSessions - a.totalSessions);

    res.json({ success: true, data: { trainers: results } });
  },
);

// Schedule analytics — utilization, attendance breakdown, status pie, peak hours
export const getScheduleAnalyticsReport = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    // 1) Utilization — fill rate per schedule + top by enrollment + top/bottom by fill rate
    const schedules: any[] = await TrainingSchedule.findAll({
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
    const breakdownRows: any[] = await ScheduleMember.findAll({
      attributes: [
        [literal('`schedule`.`class_type`'), 'classType'],
        [literal('`ScheduleMember`.`attendance_status`'), 'attendanceStatus'],
        [fn('COUNT', col('ScheduleMember.id')), 'cnt'],
      ],
      include: [
        {
          association: 'schedule',
          attributes: [],
          required: true,
        },
      ],
      group: [literal('`schedule`.`class_type`'), literal('`ScheduleMember`.`attendance_status`')],
      raw: true,
    });

    const breakdownMap = new Map<string, { ATTENDED: number; ABSENT: number; REGISTERED: number; CANCELLED: number }>();
    breakdownRows.forEach((r: any) => {
      const type = r.classType || 'UNKNOWN';
      if (!breakdownMap.has(type)) {
        breakdownMap.set(type, { ATTENDED: 0, ABSENT: 0, REGISTERED: 0, CANCELLED: 0 });
      }
      const bucket = breakdownMap.get(type)!;
      const status = r.attendanceStatus as keyof typeof bucket;
      if (status in bucket) bucket[status] = Number(r.cnt || 0);
    });
    const attendanceByType = Array.from(breakdownMap.entries()).map(([classType, counts]) => ({
      classType,
      ...counts,
    }));

    // 3) Status distribution pie
    const statusRows: any[] = await TrainingSchedule.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'cnt']],
      group: ['status'],
      raw: true,
    });
    const statusDistribution: { SCHEDULED: number; ONGOING: number; COMPLETED: number; CANCELLED: number } = {
      SCHEDULED: 0, ONGOING: 0, COMPLETED: 0, CANCELLED: 0,
    };
    statusRows.forEach((r: any) => {
      const key = r.status as keyof typeof statusDistribution;
      if (key in statusDistribution) statusDistribution[key] = Number(r.cnt || 0);
    });

    // 4) Peak hours heatmap — day_of_week x hour bucket from start_time
    const peakRows: any[] = await TrainingSchedule.findAll({
      attributes: [
        'dayOfWeek',
        [fn('HOUR', col('start_time')), 'hour'],
        [fn('COUNT', col('id')), 'cnt'],
      ],
      group: ['dayOfWeek', literal('HOUR(`TrainingSchedule`.`start_time`)')],
      raw: true,
    });

    const peakHours: { dayOfWeek: string; hour: number; count: number }[] = peakRows.map((r: any) => ({
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
  },
);
