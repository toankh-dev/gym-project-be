import { Request, Response } from 'express';
import { Op, literal } from 'sequelize';
import { Member } from '@/models/Member.model';
import { Trainer } from '@/models/Trainer.model';
import { TrainingSchedule, ScheduleMember, AttendanceLog } from '@/models/Schedule.model';
import { MemberSubscription } from '@/models/Subscription.model';
import { asyncHandler } from '@/middlewares/error.middleware';

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfPrevMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

function growth(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

export const getDashboard = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const prevMonthStart = startOfPrevMonth(now);
  const todayStr = now.toISOString().split('T')[0];

  const [totalMembers, activeMembers, totalTrainers, activeTrainers, todaySessions] = await Promise.all([
    Member.count(),
    Member.count({ where: { membershipStatus: 'ACTIVE' } }),
    Trainer.count(),
    Trainer.count({ where: { status: 'ACTIVE' } }),
    TrainingSchedule.count({ where: { startDate: todayStr } }),
  ]);

  const [monthlyRevenueRow, currMonthNew, prevMonthNew] = await Promise.all([
    MemberSubscription.sum('actualPrice', {
      where: {
        status: { [Op.in]: ['ACTIVE', 'EXPIRED'] },
        created_at: { [Op.gte]: monthStart },
      } as any,
    }),
    Member.count({ where: { created_at: { [Op.gte]: monthStart } } as any }),
    Member.count({
      where: { created_at: { [Op.gte]: prevMonthStart, [Op.lt]: monthStart } } as any,
    }),
  ]);

  const monthlyRevenue = Number(monthlyRevenueRow || 0);
  const membershipGrowth = growth(currMonthNew, prevMonthNew);

  const [attended, totalRegistered] = await Promise.all([
    ScheduleMember.count({
      where: { status: 'ATTENDED', registeredAt: { [Op.gte]: monthStart } as any },
    }),
    ScheduleMember.count({
      where: { registeredAt: { [Op.gte]: monthStart } as any },
    }),
  ]);
  const attendanceRate = totalRegistered === 0 ? 0 : Math.round((attended / totalRegistered) * 100);

  const todaySchedulesRaw: any[] = await TrainingSchedule.findAll({
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

  const todaySchedule = todaySchedulesRaw.map((s: any) => ({
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
    Member.findAll({
      limit: 5,
      order: [['created_at', 'DESC']] as any,
      include: [{ association: 'user', include: [{ association: 'profile' }] }],
      raw: true,
      nest: true,
    }),
    MemberSubscription.findAll({
      limit: 5,
      where: { status: { [Op.in]: ['ACTIVE', 'EXPIRED'] } as any },
      order: [['created_at', 'DESC']] as any,
      include: [
        {
          association: 'member',
          include: [{ association: 'user', include: [{ association: 'profile' }] }],
        },
      ],
      raw: true,
      nest: true,
    }),
    TrainingSchedule.findAll({
      limit: 5,
      order: [['created_at', 'DESC']] as any,
      include: [
        {
          association: 'trainer',
          include: [{ association: 'user', include: [{ association: 'profile' }] }],
        },
      ],
      raw: true,
      nest: true,
    }),
    AttendanceLog.findAll({
      limit: 5,
      order: [[literal('`AttendanceLog`.`check_in_time`'), 'DESC']],
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
    ...recentMembers.map((m: any) => ({
      id: `member-${m.id}`,
      type: 'MEMBER_REGISTERED' as const,
      actorName: m.user?.profile?.fullName || 'Unknown',
      description: 'New member registered',
      createdAt: m.createdAt || m.created_at,
    })),
    ...recentSubs.map((s: any) => ({
      id: `payment-${s.id}`,
      type: 'PAYMENT' as const,
      actorName: s.member?.user?.profile?.fullName || 'Unknown',
      description: `Payment ${Number(s.actualPrice).toLocaleString('vi-VN')} VND`,
      createdAt: s.createdAt || s.created_at,
    })),
    ...recentSchedulesRaw.map((s: any) => ({
      id: `schedule-${s.id}`,
      type: 'SCHEDULE_CREATED' as const,
      actorName: s.trainer?.user?.profile?.fullName || 'Unknown',
      description: `Created schedule "${s.className}"`,
      createdAt: s.createdAt,
    })),
    ...recentCheckins.map((c: any) => ({
      id: `checkin-${c.id}`,
      type: 'CHECK_IN' as const,
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

  async function countByDateField(Model: any, field: string, extra: any = {}) {
    const [today, week, month, prevMonth] = await Promise.all([
      Model.count({ where: { ...extra, [field]: { [Op.gte]: startOfToday } } as any }),
      Model.count({ where: { ...extra, [field]: { [Op.gte]: startOfWeek } } as any }),
      Model.count({ where: { ...extra, [field]: { [Op.gte]: monthStart } } as any }),
      Model.count({
        where: { ...extra, [field]: { [Op.gte]: prevMonthStart, [Op.lt]: monthStart } } as any,
      }),
    ]);
    return { today, week, month, growth: growth(month, prevMonth) };
  }

  async function sumByDateField(Model: any, field: string, sumField: string, extra: any = {}) {
    const [today, week, month, prevMonth] = await Promise.all([
      Model.sum(sumField, { where: { ...extra, [field]: { [Op.gte]: startOfToday } } as any }),
      Model.sum(sumField, { where: { ...extra, [field]: { [Op.gte]: startOfWeek } } as any }),
      Model.sum(sumField, { where: { ...extra, [field]: { [Op.gte]: monthStart } } as any }),
      Model.sum(sumField, {
        where: { ...extra, [field]: { [Op.gte]: prevMonthStart, [Op.lt]: monthStart } } as any,
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
    countByDateField(AttendanceLog, 'check_in_time'),
    countByDateField(Member, 'created_at'),
    countByDateField(TrainingSchedule, 'startDate', { status: 'COMPLETED' }),
    sumByDateField(MemberSubscription, 'created_at', 'actualPrice', {
      status: { [Op.in]: ['ACTIVE', 'EXPIRED'] } as any,
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
