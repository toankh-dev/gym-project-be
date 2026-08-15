"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressService = void 0;
const sequelize_1 = require("sequelize");
const Member_model_1 = require("@/models/Member.model");
const User_model_1 = require("@/models/User.model");
const UserProfile_model_1 = require("@/models/UserProfile.model");
const Exercise_model_1 = require("@/models/Exercise.model");
class ProgressService {
    async getMemberByUserId(userId) {
        return await Member_model_1.Member.findOne({
            where: { userId },
            raw: true
        });
    }
    async getMemberProgress(memberId, filters) {
        const member = await Member_model_1.Member.findByPk(memberId, {
            include: [
                {
                    model: Member_model_1.MemberProfile,
                    as: 'profile'
                },
                {
                    model: User_model_1.User,
                    as: 'user'
                    // Temporarily remove UserProfile include to avoid alias conflict
                }
            ],
            raw: true,
            nest: true
        });
        if (!member) {
            throw new Error('Member not found');
        }
        // Get workout progress logs
        const workoutWhere = { memberId };
        if (filters.startDate) {
            workoutWhere.workoutDate = { [sequelize_1.Op.gte]: new Date(filters.startDate) };
        }
        if (filters.endDate) {
            workoutWhere.workoutDate = {
                ...workoutWhere.workoutDate,
                [sequelize_1.Op.lte]: new Date(filters.endDate)
            };
        }
        const workoutLogs = await Exercise_model_1.WorkoutProgressLog.findAll({
            where: workoutWhere,
            include: [
                {
                    model: Exercise_model_1.Exercise,
                    as: 'exercise',
                    attributes: ['id', 'name', 'category', 'muscleGroup']
                }
            ],
            order: [['workoutDate', 'DESC']],
            limit: 50
        });
        return {
            member: {
                id: member.id,
                memberCode: member.memberCode,
                joinDate: member.joinDate,
                membershipStatus: member.membershipStatus,
                user: {
                    id: member.user.id,
                    username: member.user.username,
                    email: member.user.email
                    // profile: member.user.profile // Temporarily removed due to alias conflict
                }
            },
            profile: member.profile,
            workoutLogs,
            summary: {
                totalWorkouts: workoutLogs.length,
                avgCaloriesPerSession: workoutLogs.length > 0
                    ? Math.round(workoutLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0) / workoutLogs.length)
                    : 0,
                mostFrequentExercise: this.getMostFrequentExercise(workoutLogs),
                lastWorkout: workoutLogs[0]?.workoutDate || null
            }
        };
    }
    async getCurrentMemberProgress(memberId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const filters = {
            startDate: thirtyDaysAgo.toISOString().split('T')[0]
        };
        const progress = await this.getMemberProgress(memberId, filters);
        // Calculate additional current metrics
        const profile = progress.profile;
        const currentMetrics = {
            weight: profile?.weightKg,
            bodyFat: profile?.bodyFatPercent,
            muscleMass: profile?.muscleMassKg,
            bmi: profile?.bmi || (profile?.heightCm && profile?.weightKg ?
                parseFloat((profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1)) : null)
        };
        // Get recent workout frequency
        const recentWorkouts = progress.workoutLogs.filter(log => {
            const logDate = new Date(log.workoutDate);
            return logDate >= thirtyDaysAgo;
        });
        const weeklyFrequency = Math.round((recentWorkouts.length / 4) * 10) / 10;
        return {
            ...progress,
            currentMetrics,
            weeklyFrequency,
            progressTrend: {
                // This would require historical data comparison
                // For now, return placeholder
                isImproving: recentWorkouts.length > 0,
                lastUpdated: profile?.updatedAt
            }
        };
    }
    async updateMemberProfile(memberId, updates) {
        const member = await Member_model_1.Member.findByPk(memberId, {
            include: [
                {
                    model: Member_model_1.MemberProfile,
                    as: 'profile'
                }
            ]
        });
        if (!member) {
            return null;
        }
        let profile = member.profile;
        if (profile) {
            // Update existing profile
            await profile.update(updates);
            // Auto-calculate BMI if height and weight are provided
            if (updates.heightCm || updates.weightKg) {
                const height = updates.heightCm || profile.heightCm;
                const weight = updates.weightKg || profile.weightKg;
                if (height && weight) {
                    const bmi = parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1));
                    await profile.update({ bmi });
                }
            }
        }
        else {
            // Create new profile
            profile = await Member_model_1.MemberProfile.create({
                memberId,
                ...updates
            });
        }
        // Return updated member with profile
        return await Member_model_1.Member.findByPk(memberId, {
            include: [
                {
                    model: Member_model_1.MemberProfile,
                    as: 'profile'
                },
                {
                    model: User_model_1.User,
                    as: 'user',
                    include: [
                        {
                            model: UserProfile_model_1.UserProfile,
                            as: 'profile'
                        }
                    ]
                }
            ]
        });
    }
    async createProgressEntry(memberId, progressData) {
        // This could be body measurements, fitness assessments, etc.
        const member = await Member_model_1.Member.findByPk(memberId);
        if (!member) {
            throw new Error('Member not found');
        }
        // For now, update member profile with new measurements
        return await this.updateMemberProfile(memberId, progressData);
    }
    async getProgressStatistics(memberId, period = '30') {
        const member = await Member_model_1.Member.findByPk(memberId, {
            include: [
                {
                    model: Member_model_1.MemberProfile,
                    as: 'profile'
                }
            ]
        });
        if (!member) {
            throw new Error('Member not found');
        }
        const periodDays = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);
        // Get workout logs for the period
        const workoutLogs = await Exercise_model_1.WorkoutProgressLog.findAll({
            where: {
                memberId,
                workoutDate: {
                    [sequelize_1.Op.gte]: startDate
                }
            }
        });
        // Calculate workout statistics
        const totalWorkouts = workoutLogs.length;
        const totalCaloriesBurned = workoutLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
        const thisWeek = workoutLogs.filter(log => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(log.workoutDate) >= weekAgo;
        }).length;
        const averagePerWeek = Math.round((totalWorkouts / (periodDays / 7)) * 10) / 10;
        // Calculate days since joining
        const joinDate = new Date(member.joinDate);
        const today = new Date();
        const daysActive = Math.floor((today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        const profile = member.profile;
        return {
            currentMetrics: {
                weight: profile?.weightKg,
                bodyFat: profile?.bodyFatPercent,
                muscleMass: profile?.muscleMassKg,
                bmi: profile?.bmi
            },
            progressTrend: {
                // For now, return basic info - would need historical tracking for real trends
                weightChange: 0,
                bodyFatChange: 0,
                muscleMassChange: 0,
                bmiChange: 0
            },
            workoutStats: {
                totalWorkouts,
                thisWeek,
                thisMonth: workoutLogs.filter(log => {
                    const monthAgo = new Date();
                    monthAgo.setDate(monthAgo.getDate() - 30);
                    return new Date(log.workoutDate) >= monthAgo;
                }).length,
                averagePerWeek,
                totalCaloriesBurned
            },
            goalProgress: {
                fitnessGoal: profile?.fitnessGoal,
                trainingLevel: profile?.trainingLevel || 'BEGINNER',
                joinDate: member.joinDate.toISOString().split('T')[0],
                daysActive
            }
        };
    }
    async getWorkoutProgress(memberId, options) {
        const workoutLogs = await Exercise_model_1.WorkoutProgressLog.findAndCountAll({
            where: { memberId },
            include: [
                {
                    model: Exercise_model_1.Exercise,
                    as: 'exercise',
                    attributes: ['id', 'name', 'category', 'muscleGroup']
                }
            ],
            order: [['workoutDate', 'DESC']],
            limit: options.limit,
            offset: options.offset
        });
        return {
            workouts: workoutLogs.rows,
            pagination: {
                total: workoutLogs.count,
                limit: options.limit,
                offset: options.offset,
                pages: Math.ceil(workoutLogs.count / options.limit)
            }
        };
    }
    async createWorkoutLog(memberId, workoutData) {
        const workoutLog = await Exercise_model_1.WorkoutProgressLog.create({
            memberId,
            ...workoutData
        });
        // Return with exercise details
        return await Exercise_model_1.WorkoutProgressLog.findByPk(workoutLog.id, {
            include: [
                {
                    model: Exercise_model_1.Exercise,
                    as: 'exercise',
                    attributes: ['id', 'name', 'category', 'muscleGroup']
                }
            ]
        });
    }
    getMostFrequentExercise(workoutLogs) {
        const exerciseCounts = {};
        workoutLogs.forEach(log => {
            const exerciseName = log.exercise?.name || 'Unknown';
            exerciseCounts[exerciseName] = (exerciseCounts[exerciseName] || 0) + 1;
        });
        const mostFrequent = Object.entries(exerciseCounts)
            .sort(([, a], [, b]) => b - a)[0];
        return mostFrequent ? { name: mostFrequent[0], count: mostFrequent[1] } : null;
    }
}
exports.ProgressService = ProgressService;
//# sourceMappingURL=progress.service.js.map