"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const subscription_service_1 = require("@/services/subscription.service");
const logger_1 = require("@/utils/logger");
class SubscriptionController {
    subscriptionService;
    constructor() {
        this.subscriptionService = new subscription_service_1.SubscriptionService();
    }
    getSubscriptions = async (req, res) => {
        try {
            const { page = 1, limit = 10, status, memberId } = req.query;
            const result = await this.subscriptionService.getSubscriptions({
                page: parseInt(page),
                limit: parseInt(limit),
                status: status,
                memberId: memberId
            });
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting subscriptions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get subscriptions',
                error: error.message
            });
        }
    };
    getSubscriptionById = async (req, res) => {
        try {
            const { id } = req.params;
            const subscription = await this.subscriptionService.getSubscriptionById(parseInt(id));
            if (!subscription) {
                res.status(404).json({
                    success: false,
                    message: 'Subscription not found'
                });
                return;
            }
            res.json({
                success: true,
                data: subscription
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting subscription by ID:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get subscription',
                error: error.message
            });
        }
    };
    getMemberSubscriptions = async (req, res) => {
        try {
            const { memberId } = req.params;
            const { includeExpired = false } = req.query;
            const subscriptions = await this.subscriptionService.getMemberSubscriptions(parseInt(memberId), includeExpired === 'true');
            res.json({
                success: true,
                data: subscriptions
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting member subscriptions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get member subscriptions',
                error: error.message
            });
        }
    };
    getCurrentMemberSubscription = async (req, res) => {
        try {
            const user = req.user;
            // Get member ID from user
            const member = await this.subscriptionService.getMemberByUserId(user.id);
            if (!member) {
                res.status(404).json({
                    success: false,
                    message: 'Member profile not found'
                });
                return;
            }
            const subscription = await this.subscriptionService.getCurrentMemberSubscription(member.id);
            res.json({
                success: true,
                data: subscription
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting current member subscription:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get current subscription',
                error: error.message
            });
        }
    };
    createSubscription = async (req, res) => {
        try {
            const { memberId, packageId, startDate, paymentMethod } = req.body;
            const user = req.user;
            const subscription = await this.subscriptionService.createSubscription({
                memberId: parseInt(memberId),
                packageId: parseInt(packageId),
                startDate: new Date(startDate),
                registeredBy: user.id,
                paymentMethod
            });
            res.status(201).json({
                success: true,
                message: 'Subscription created successfully',
                data: subscription
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating subscription:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create subscription',
                error: error.message
            });
        }
    };
    updateSubscription = async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            const subscription = await this.subscriptionService.updateSubscription(parseInt(id), updates);
            if (!subscription) {
                res.status(404).json({
                    success: false,
                    message: 'Subscription not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Subscription updated successfully',
                data: subscription
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating subscription:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update subscription',
                error: error.message
            });
        }
    };
    cancelSubscription = async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const subscription = await this.subscriptionService.cancelSubscription(parseInt(id), reason);
            if (!subscription) {
                res.status(404).json({
                    success: false,
                    message: 'Subscription not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Subscription cancelled successfully',
                data: subscription
            });
        }
        catch (error) {
            logger_1.logger.error('Error cancelling subscription:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel subscription',
                error: error.message
            });
        }
    };
    renewSubscription = async (req, res) => {
        try {
            const { id } = req.params;
            const { packageId, paymentMethod } = req.body;
            const user = req.user;
            const newSubscription = await this.subscriptionService.renewSubscription({
                currentSubscriptionId: parseInt(id),
                newPackageId: packageId ? parseInt(packageId) : undefined,
                registeredBy: user.id,
                paymentMethod
            });
            res.json({
                success: true,
                message: 'Subscription renewed successfully',
                data: newSubscription
            });
        }
        catch (error) {
            logger_1.logger.error('Error renewing subscription:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to renew subscription',
                error: error.message
            });
        }
    };
    getSubscriptionStatistics = async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const stats = await this.subscriptionService.getSubscriptionStatistics({
                startDate: startDate,
                endDate: endDate
            });
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting subscription statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get subscription statistics',
                error: error.message
            });
        }
    };
}
exports.SubscriptionController = SubscriptionController;
//# sourceMappingURL=subscription.controller.js.map