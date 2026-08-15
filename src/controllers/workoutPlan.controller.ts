import { Request, Response, NextFunction } from 'express';
import { WorkoutPlan, WorkoutPlanExercise } from '@/models/WorkoutPlan.model';
import { Trainer } from '@/models/Trainer.model';
import { Member } from '@/models/Member.model';
import { Exercise } from '@/models/Exercise.model';
import sequelize from '@/config/database.config';
import { asyncHandler, createError } from '@/middlewares/error.middleware';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

async function resolveTrainer(req: Request): Promise<any> {
  const user = req.user!;
  const trainer = await Trainer.findOne({ where: { userId: user.id }, raw: true });
  if (!trainer) throw createError.forbidden('No trainer profile for this user');
  return trainer;
}

function emptyDayBuckets(): Record<string, any[]> {
  return DAYS.reduce((acc, d) => { acc[d] = []; return acc; }, {} as Record<string, any[]>);
}

export const listWorkoutPlans = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const trainer = await resolveTrainer(req);
  const { status, memberId, page = 1, limit = 10 } = req.query;

  const where: any = { trainerId: trainer.id };
  if (status) where.status = status;
  if (memberId) where.memberId = parseInt(String(memberId), 10);

  const offset = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);
  const count = await WorkoutPlan.count({ where });
  const rows: any[] = await WorkoutPlan.findAll({
    where,
    include: [
      {
        association: 'member',
        attributes: ['id', 'memberCode'],
        include: [{ association: 'user', attributes: [], include: [{ association: 'profile', attributes: ['fullName'] }] }],
      },
    ],
    limit: parseInt(String(limit), 10),
    offset,
    order: [['created_at', 'DESC']] as any,
    raw: true,
    nest: true,
  });

  const plans = rows.map((p: any) => ({
    id: p.id,
    planName: p.planName,
    goal: p.goal,
    difficultyLevel: p.difficultyLevel,
    durationWeeks: p.durationWeeks,
    sessionsPerWeek: p.sessionsPerWeek,
    startDate: p.startDate,
    endDate: p.endDate,
    status: p.status,
    member: {
      id: p.member?.id,
      memberCode: p.member?.memberCode,
      fullName: p.member?.user?.profile?.fullName || 'Unknown',
    },
  }));

  res.json({
    success: true,
    data: {
      plans,
      pagination: {
        page: parseInt(String(page), 10),
        limit: parseInt(String(limit), 10),
        total: count,
        totalPages: Math.ceil(count / parseInt(String(limit), 10)),
      },
    },
  });
});

async function fetchPlanPayload(planId: number, trainerId: number): Promise<any> {
  const plan: any = await WorkoutPlan.findByPk(planId, {
    include: [
      {
        association: 'member',
        attributes: ['id', 'memberCode'],
        include: [{ association: 'user', attributes: [], include: [{ association: 'profile', attributes: ['fullName'] }] }],
      },
    ],
    raw: true,
    nest: true,
  });

  if (!plan) throw createError.notFound('Plan not found');
  if (plan.trainerId !== trainerId) throw createError.forbidden('You do not own this plan');

  const exerciseRows: any[] = await WorkoutPlanExercise.findAll({
    where: { workoutPlanId: planId },
    include: [{ association: 'exercise', attributes: ['id', 'name', 'category', 'muscleGroup'] }],
    order: [['exercise_order', 'ASC']] as any,
    raw: true,
    nest: true,
  });

  const buckets = emptyDayBuckets();
  exerciseRows.forEach((ex: any) => {
    if (!buckets[ex.dayOfWeek]) return;
    buckets[ex.dayOfWeek].push({
      id: ex.id,
      exerciseOrder: ex.exerciseOrder,
      exercise: {
        id: ex.exercise?.id,
        name: ex.exercise?.name,
        category: ex.exercise?.category,
        muscleGroup: ex.exercise?.muscleGroup,
      },
      sets: ex.sets,
      reps: ex.reps,
      weightKg: ex.weightKg !== null && ex.weightKg !== undefined ? Number(ex.weightKg) : null,
      durationMinutes: ex.durationMinutes,
      restSeconds: ex.restSeconds,
      notes: ex.notes,
    });
  });

  return {
    plan: {
      id: plan.id,
      planName: plan.planName,
      description: plan.description,
      goal: plan.goal,
      difficultyLevel: plan.difficultyLevel,
      durationWeeks: plan.durationWeeks,
      sessionsPerWeek: plan.sessionsPerWeek,
      startDate: plan.startDate,
      endDate: plan.endDate,
      status: plan.status,
      notes: plan.notes,
      member: {
        id: plan.member?.id,
        memberCode: plan.member?.memberCode,
        fullName: plan.member?.user?.profile?.fullName || 'Unknown',
      },
      exercisesByDay: buckets,
    },
  };
}

export const getWorkoutPlanById = asyncHandler(async (req: Request, res: Response, _next?: NextFunction): Promise<void> => {
  const trainer = await resolveTrainer(req);
  const id = parseInt(req.params.id, 10);
  const data = await fetchPlanPayload(id, trainer.id);
  res.json({ success: true, data });
});

export const createWorkoutPlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const trainer = await resolveTrainer(req);
  const {
    memberId, planName, goal, difficultyLevel, durationWeeks, sessionsPerWeek,
    startDate, endDate, description, notes, status = 'DRAFT', exercises = [],
  } = req.body;

  if (!Number.isInteger(memberId)) throw createError.validation('memberId is required');
  if (!planName || !goal || !difficultyLevel) throw createError.validation('planName, goal, difficultyLevel are required');
  if (!Number.isInteger(durationWeeks) || durationWeeks <= 0) throw createError.validation('durationWeeks must be > 0');
  if (!Number.isInteger(sessionsPerWeek) || sessionsPerWeek < 1) throw createError.validation('sessionsPerWeek must be >= 1');
  if (!Array.isArray(exercises) || exercises.length === 0) throw createError.validation('At least one exercise is required');

  const member: any = await Member.findByPk(memberId, { raw: true });
  if (!member) throw createError.notFound('Member not found');
  const memberTrainerId = member.assignedTrainerId ?? member.assigned_trainer_id;
  if (memberTrainerId !== trainer.id) {
    throw createError.forbidden('This member is not assigned to you');
  }

  const exerciseIds = Array.from(new Set(exercises.map((e: any) => e.exerciseId)));
  const existingExercises = await Exercise.findAll({ where: { id: exerciseIds as any } });
  if (existingExercises.length !== exerciseIds.length) {
    throw createError.validation('One or more exerciseId values are invalid');
  }

  const result = await sequelize.transaction(async (t) => {
    const plan = await WorkoutPlan.create({
      memberId, trainerId: trainer.id, planName, description, goal, difficultyLevel,
      durationWeeks, sessionsPerWeek, startDate, endDate, status, notes,
    } as any, { transaction: t });

    const rows = exercises.map((e: any) => ({
      workoutPlanId: plan.id,
      exerciseId: e.exerciseId,
      dayOfWeek: e.dayOfWeek,
      exerciseOrder: e.exerciseOrder || 1,
      sets: e.sets ?? null,
      reps: e.reps ?? null,
      weightKg: e.weightKg ?? null,
      durationMinutes: e.durationMinutes ?? null,
      restSeconds: e.restSeconds ?? null,
      notes: e.notes ?? null,
    }));
    await WorkoutPlanExercise.bulkCreate(rows, { transaction: t });
    return plan;
  });

  const data = await fetchPlanPayload(result.id, trainer.id);
  res.json({ success: true, data });
});

export const updateWorkoutPlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const trainer = await resolveTrainer(req);
  const id = parseInt(req.params.id, 10);

  const planRaw: any = await WorkoutPlan.findByPk(id, { raw: true });
  if (!planRaw) throw createError.notFound('Plan not found');
  if (planRaw.trainerId !== trainer.id) throw createError.forbidden('You do not own this plan');

  const plan: any = await WorkoutPlan.findByPk(id);
  if (!plan) throw createError.notFound('Plan not found');

  const allowed = ['planName', 'goal', 'difficultyLevel', 'durationWeeks', 'sessionsPerWeek',
    'startDate', 'endDate', 'description', 'notes', 'status'];
  const updates: any = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  if (updates.durationWeeks !== undefined && updates.durationWeeks <= 0) {
    throw createError.validation('durationWeeks must be > 0');
  }
  if (updates.sessionsPerWeek !== undefined && updates.sessionsPerWeek < 1) {
    throw createError.validation('sessionsPerWeek must be >= 1');
  }

  await plan.update(updates);
  const data = await fetchPlanPayload(id, trainer.id);
  res.json({ success: true, data });
});

export const deleteWorkoutPlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const trainer = await resolveTrainer(req);
  const id = parseInt(req.params.id, 10);

  const planRaw: any = await WorkoutPlan.findByPk(id, { raw: true });
  if (!planRaw) throw createError.notFound('Plan not found');
  if (planRaw.trainerId !== trainer.id) throw createError.forbidden('You do not own this plan');

  const plan: any = await WorkoutPlan.findByPk(id);
  if (!plan) throw createError.notFound('Plan not found');

  await WorkoutPlanExercise.destroy({ where: { workoutPlanId: id } });
  await plan.destroy();
  res.json({ success: true, message: 'Plan deleted' });
});
