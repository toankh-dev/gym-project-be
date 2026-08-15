"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressController = void 0;
const progress_service_1 = require("@/services/progress.service");
const logger_1 = require("@/utils/logger");
class ProgressController {
    progressService;
    constructor() {
        this.progressService = new progress_service_1.ProgressService();
    }
    getMemberProgress = async (req, res) => {
        try {
            const { memberId } = req.params;
            const { startDate, endDate, type } = req.query;
            const progress = await this.progressService.getMemberProgress(parseInt(memberId), {
                startDate: startDate,
                endDate: endDate,
                type: type
            });
            res.json({
                success: true,
                data: progress
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting member progress:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get member progress',
                error: error.message
            });
        }
    };
    getCurrentMemberProgress = async (req, res) => {
        try {
            const user = req.user;
            // Check if user is admin - admins cannot have personal progress
            if (user.role?.name === 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Admin users do not have member progress. Use /api/members/:id/progress to view member progress.'
                });
                return;
            }
            const member = await this.progressService.getMemberByUserId(user.id);
            if (!member) {
                res.status(404).json({
                    success: false,
                    message: 'Member profile not found. This endpoint is only for users with member role.'
                });
                return;
            }
            const progress = await this.progressService.getCurrentMemberProgress(member.id);
            res.json({
                success: true,
                data: progress
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting current member progress:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get current progress',
                error: error.message
            });
        }
    };
    createProgressEntry = async (req, res) => {
        try {
            const { memberId } = req.params;
            const progressData = req.body;
            const progress = await this.progressService.createProgressEntry(parseInt(memberId), progressData);
            res.status(201).json({
                success: true,
                message: 'Progress entry created successfully',
                data: progress
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating progress entry:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create progress entry',
                error: error.message
            });
        }
    };
    updateMemberProfile = async (req, res) => {
        try {
            const { memberId } = req.params;
            const updates = req.body;
            const updatedProfile = await this.progressService.updateMemberProfile(parseInt(memberId), updates);
            if (!updatedProfile) {
                res.status(404).json({
                    success: false,
                    message: 'Member profile not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Member profile updated successfully',
                data: updatedProfile
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating member profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update member profile',
                error: error.message
            });
        }
    };
    updateCurrentMemberProfile = async (req, res) => {
        try {
            const user = req.user;
            // Check if user is admin - admins cannot update member profile
            if (user.role?.name === 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Admin users do not have member profiles. Use /api/members/:id/profile to update member profiles.'
                });
                return;
            }
            const member = await this.progressService.getMemberByUserId(user.id);
            if (!member) {
                res.status(404).json({
                    success: false,
                    message: 'Member profile not found. This endpoint is only for users with member role.'
                });
                return;
            }
            const updates = req.body;
            const updatedProfile = await this.progressService.updateMemberProfile(member.id, updates);
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedProfile
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating current member profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile',
                error: error.message
            });
        }
    };
    getProgressStatistics = async (req, res) => {
        try {
            const { memberId } = req.params;
            const { period } = req.query;
            const stats = await this.progressService.getProgressStatistics(parseInt(memberId), period);
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting progress statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get progress statistics',
                error: error.message
            });
        }
    };
    getWorkoutProgress = async (req, res) => {
        try {
            const { memberId } = req.params;
            const { limit = 20, offset = 0 } = req.query;
            const workoutProgress = await this.progressService.getWorkoutProgress(parseInt(memberId), {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            res.json({
                success: true,
                data: workoutProgress
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting workout progress:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get workout progress',
                error: error.message
            });
        }
    };
    createWorkoutLog = async (req, res) => {
        try {
            const user = req.user;
            // Check if user is admin - admins cannot create workout logs
            if (user.role?.name === 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Admin users cannot create workout logs. This endpoint is only for members.'
                });
                return;
            }
            const member = await this.progressService.getMemberByUserId(user.id);
            if (!member) {
                res.status(404).json({
                    success: false,
                    message: 'Member profile not found. This endpoint is only for users with member role.'
                });
                return;
            }
            const workoutData = req.body;
            const workoutLog = await this.progressService.createWorkoutLog(member.id, workoutData);
            res.status(201).json({
                success: true,
                message: 'Workout log created successfully',
                data: workoutLog
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating workout log:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create workout log',
                error: error.message
            });
        }
    };
}
exports.ProgressController = ProgressController;
//# sourceMappingURL=progress.controller.js.map