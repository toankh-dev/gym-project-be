"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWorkoutPlan = exports.updateWorkoutPlan = exports.createWorkoutPlan = exports.getWorkoutPlanById = exports.listWorkoutPlans = void 0;
const WorkoutPlan_model_1 = require("@/models/WorkoutPlan.model");
const Trainer_model_1 = require("@/models/Trainer.model");
const Member_model_1 = require("@/models/Member.model");
const Exercise_model_1 = require("@/models/Exercise.model");
const database_config_1 = __importDefault(require("@/config/database.config"));
const error_middleware_1 = require("@/middlewares/error.middleware");
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
async function resolveTrainer(req) {
    const user = req.user;
    const trainer = await Trainer_model_1.Trainer.findOne({ where: { userId: user.id }, raw: true });
    if (!trainer)
        throw error_middleware_1.createError.forbidden('No trainer profile for this user');
    return trainer;
}
function emptyDayBuckets() {
    return DAYS.reduce((acc, d) => { acc[d] = []; return acc; }, {});
}
exports.listWorkoutPlans = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const trainer = await resolveTrainer(req);
    const { status, memberId, page = 1, limit = 10 } = req.query;
    const where = { trainerId: trainer.id };
    if (status)
        where.status = status;
    if (memberId)
        where.memberId = parseInt(String(memberId), 10);
    const offset = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);
    const count = await WorkoutPlan_model_1.WorkoutPlan.count({ where });
    const rows = await WorkoutPlan_model_1.WorkoutPlan.findAll({
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
        order: [['created_at', 'DESC']],
        raw: true,
        nest: true,
    });
    const plans = rows.map((p) => ({
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
async function fetchPlanPayload(planId, trainerId) {
    const plan = await WorkoutPlan_model_1.WorkoutPlan.findByPk(planId, {
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
    if (!plan)
        throw error_middleware_1.createError.notFound('Plan not found');
    if (plan.trainerId !== trainerId)
        throw error_middleware_1.createError.forbidden('You do not own this plan');
    const exerciseRows = await WorkoutPlan_model_1.WorkoutPlanExercise.findAll({
        where: { workoutPlanId: planId },
        include: [{ association: 'exercise', attributes: ['id', 'name', 'category', 'muscleGroup'] }],
        order: [['exercise_order', 'ASC']],
        raw: true,
        nest: true,
    });
    const buckets = emptyDayBuckets();
    exerciseRows.forEach((ex) => {
        if (!buckets[ex.dayOfWeek])
            return;
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
exports.getWorkoutPlanById = (0, error_middleware_1.asyncHandler)(async (req, res, _next) => {
    const trainer = await resolveTrainer(req);
    const id = parseInt(req.params.id, 10);
    const data = await fetchPlanPayload(id, trainer.id);
    res.json({ success: true, data });
});
exports.createWorkoutPlan = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const trainer = await resolveTrainer(req);
    const { memberId, planName, goal, difficultyLevel, durationWeeks, sessionsPerWeek, startDate, endDate, description, notes, status = 'DRAFT', exercises = [], } = req.body;
    if (!Number.isInteger(memberId))
        throw error_middleware_1.createError.validation('memberId is required');
    if (!planName || !goal || !difficultyLevel)
        throw error_middleware_1.createError.validation('planName, goal, difficultyLevel are required');
    if (!Number.isInteger(durationWeeks) || durationWeeks <= 0)
        throw error_middleware_1.createError.validation('durationWeeks must be > 0');
    if (!Number.isInteger(sessionsPerWeek) || sessionsPerWeek < 1)
        throw error_middleware_1.createError.validation('sessionsPerWeek must be >= 1');
    if (!Array.isArray(exercises) || exercises.length === 0)
        throw error_middleware_1.createError.validation('At least one exercise is required');
    const member = await Member_model_1.Member.findByPk(memberId, { raw: true });
    if (!member)
        throw error_middleware_1.createError.notFound('Member not found');
    const memberTrainerId = member.assignedTrainerId ?? member.assigned_trainer_id;
    if (memberTrainerId !== trainer.id) {
        throw error_middleware_1.createError.forbidden('This member is not assigned to you');
    }
    const exerciseIds = Array.from(new Set(exercises.map((e) => e.exerciseId)));
    const existingExercises = await Exercise_model_1.Exercise.findAll({ where: { id: exerciseIds } });
    if (existingExercises.length !== exerciseIds.length) {
        throw error_middleware_1.createError.validation('One or more exerciseId values are invalid');
    }
    const result = await database_config_1.default.transaction(async (t) => {
        const plan = await WorkoutPlan_model_1.WorkoutPlan.create({
            memberId, trainerId: trainer.id, planName, description, goal, difficultyLevel,
            durationWeeks, sessionsPerWeek, startDate, endDate, status, notes,
        }, { transaction: t });
        const rows = exercises.map((e) => ({
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
        await WorkoutPlan_model_1.WorkoutPlanExercise.bulkCreate(rows, { transaction: t });
        return plan;
    });
    const data = await fetchPlanPayload(result.id, trainer.id);
    res.json({ success: true, data });
});
exports.updateWorkoutPlan = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const trainer = await resolveTrainer(req);
    const id = parseInt(req.params.id, 10);
    const planRaw = await WorkoutPlan_model_1.WorkoutPlan.findByPk(id, { raw: true });
    if (!planRaw)
        throw error_middleware_1.createError.notFound('Plan not found');
    if (planRaw.trainerId !== trainer.id)
        throw error_middleware_1.createError.forbidden('You do not own this plan');
    const plan = await WorkoutPlan_model_1.WorkoutPlan.findByPk(id);
    if (!plan)
        throw error_middleware_1.createError.notFound('Plan not found');
    const allowed = ['planName', 'goal', 'difficultyLevel', 'durationWeeks', 'sessionsPerWeek',
        'startDate', 'endDate', 'description', 'notes', 'status'];
    const updates = {};
    for (const k of allowed) {
        if (req.body[k] !== undefined)
            updates[k] = req.body[k];
    }
    if (updates.durationWeeks !== undefined && updates.durationWeeks <= 0) {
        throw error_middleware_1.createError.validation('durationWeeks must be > 0');
    }
    if (updates.sessionsPerWeek !== undefined && updates.sessionsPerWeek < 1) {
        throw error_middleware_1.createError.validation('sessionsPerWeek must be >= 1');
    }
    await plan.update(updates);
    const data = await fetchPlanPayload(id, trainer.id);
    res.json({ success: true, data });
});
exports.deleteWorkoutPlan = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const trainer = await resolveTrainer(req);
    const id = parseInt(req.params.id, 10);
    const planRaw = await WorkoutPlan_model_1.WorkoutPlan.findByPk(id, { raw: true });
    if (!planRaw)
        throw error_middleware_1.createError.notFound('Plan not found');
    if (planRaw.trainerId !== trainer.id)
        throw error_middleware_1.createError.forbidden('You do not own this plan');
    const plan = await WorkoutPlan_model_1.WorkoutPlan.findByPk(id);
    if (!plan)
        throw error_middleware_1.createError.notFound('Plan not found');
    await WorkoutPlan_model_1.WorkoutPlanExercise.destroy({ where: { workoutPlanId: id } });
    await plan.destroy();
    res.json({ success: true, message: 'Plan deleted' });
});
//# sourceMappingURL=workoutPlan.controller.js.map