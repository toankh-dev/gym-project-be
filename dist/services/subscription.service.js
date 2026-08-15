"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const sequelize_1 = require("sequelize");
const Subscription_model_1 = require("@/models/Subscription.model");
const Member_model_1 = require("@/models/Member.model");
const User_model_1 = require("@/models/User.model");
const UserProfile_model_1 = require("@/models/UserProfile.model");
const logger_1 = require("@/utils/logger");
class SubscriptionService {
    async getSubscriptions(filters) {
        const { page, limit, status, memberId } = filters;
        const offset = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (memberId) {
            where.memberId = parseInt(memberId);
        }
        const { rows: subscriptions, count: total } = await Subscription_model_1.MemberSubscription.findAndCountAll({
            where,
            include: [
                {
                    model: Member_model_1.Member,
                    as: 'member',
                    include: [
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
                },
                {
                    model: Subscription_model_1.MembershipPackage,
                    as: 'package'
                },
                {
                    model: User_model_1.User,
                    as: 'registeredByUser',
                    include: [
                        {
                            model: UserProfile_model_1.UserProfile,
                            as: 'profile'
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        return {
            subscriptions,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async getSubscriptionById(id) {
        return await Subscription_model_1.MemberSubscription.findByPk(id, {
            include: [
                {
                    model: Member_model_1.Member,
                    as: 'member',
                    include: [
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
                },
                {
                    model: Subscription_model_1.MembershipPackage,
                    as: 'package'
                },
                {
                    model: User_model_1.User,
                    as: 'registeredByUser',
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
    async getMemberSubscriptions(memberId, includeExpired = false) {
        const where = { memberId };
        if (!includeExpired) {
            where.status = {
                [sequelize_1.Op.in]: ['PENDING', 'ACTIVE']
            };
        }
        return await Subscription_model_1.MemberSubscription.findAll({
            where,
            include: [
                {
                    model: Subscription_model_1.MembershipPackage,
                    as: 'package'
                }
            ],
            order: [['createdAt', 'DESC']]
        });
    }
    async getCurrentMemberSubscription(memberId) {
        const subscription = await Subscription_model_1.MemberSubscription.findOne({
            where: {
                memberId,
                status: 'ACTIVE',
            },
            include: [
                {
                    model: Subscription_model_1.MembershipPackage,
                    as: 'package'
                }
            ],
            order: [['end_date', 'DESC']],
            raw: true,
            nest: true
        });
        if (subscription && subscription.endDate) {
            const now = new Date();
            const end = new Date(subscription.endDate);
            const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
            const isExpired = end < now;
            return { ...subscription, daysRemaining, isExpired };
        }
        return null;
    }
    async getMemberByUserId(userId) {
        return await Member_model_1.Member.findOne({
            where: { userId },
            raw: true
        });
    }
    async createSubscription(params) {
        const { memberId, packageId, startDate, registeredBy, paymentMethod } = params;
        // Get package details
        const membershipPackage = await Subscription_model_1.MembershipPackage.findByPk(packageId);
        if (!membershipPackage) {
            throw new Error('Membership package not found');
        }
        if (!membershipPackage.isActive()) {
            throw new Error('Membership package is not active');
        }
        // Check if member exists
        const member = await Member_model_1.Member.findByPk(memberId);
        if (!member) {
            throw new Error('Member not found');
        }
        // Calculate end date
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + membershipPackage.durationMonths);
        // Check for overlapping active subscriptions
        const existingSubscription = await Subscription_model_1.MemberSubscription.findOne({
            where: {
                memberId,
                status: 'ACTIVE',
                endDate: {
                    [sequelize_1.Op.gte]: startDate
                }
            }
        });
        if (existingSubscription) {
            throw new Error('Member already has an active subscription that overlaps with the new subscription period');
        }
        // Create subscription
        const subscription = await Subscription_model_1.MemberSubscription.create({
            memberId,
            packageId,
            startDate,
            endDate,
            actualPrice: membershipPackage.price,
            status: 'PENDING', // Will be activated after payment
            registeredBy
        });
        // TODO: Create payment record
        // await this.createPaymentRecord(subscription, paymentMethod);
        logger_1.logger.info(`Subscription created for member ${memberId}, package ${packageId}`);
        return await this.getSubscriptionById(subscription.id);
    }
    async updateSubscription(id, updates) {
        const subscription = await Subscription_model_1.MemberSubscription.findByPk(id);
        if (!subscription) {
            return null;
        }
        await subscription.update(updates);
        return await this.getSubscriptionById(id);
    }
    async cancelSubscription(id, reason) {
        const subscription = await Subscription_model_1.MemberSubscription.findByPk(id);
        if (!subscription) {
            return null;
        }
        await subscription.update({
            status: 'CANCELLED'
        });
        // TODO: Create cancellation record with reason
        logger_1.logger.info(`Subscription ${id} cancelled. Reason: ${reason || 'Not provided'}`);
        return await this.getSubscriptionById(id);
    }
    async renewSubscription(params) {
        const { currentSubscriptionId, newPackageId, registeredBy, paymentMethod } = params;
        const currentSubscription = await this.getSubscriptionById(currentSubscriptionId);
        if (!currentSubscription) {
            throw new Error('Current subscription not found');
        }
        const packageId = newPackageId || currentSubscription.packageId;
        const memberId = currentSubscription.memberId;
        // Start new subscription from the end of current subscription or today, whichever is later
        const today = new Date();
        const startDate = currentSubscription.endDate > today ? currentSubscription.endDate : today;
        const newSubscription = await this.createSubscription({
            memberId,
            packageId,
            startDate,
            registeredBy,
            paymentMethod
        });
        logger_1.logger.info(`Subscription renewed for member ${memberId}, old subscription ${currentSubscriptionId}, new subscription ${newSubscription.id}`);
        return newSubscription;
    }
    async activateSubscription(id) {
        const subscription = await Subscription_model_1.MemberSubscription.findByPk(id);
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        if (subscription.status !== 'PENDING') {
            throw new Error('Only pending subscriptions can be activated');
        }
        await subscription.update({ status: 'ACTIVE' });
        // Update member's current subscription
        await Member_model_1.Member.update({ currentSubscriptionId: id }, { where: { id: subscription.memberId } });
        logger_1.logger.info(`Subscription ${id} activated for member ${subscription.memberId}`);
        return await this.getSubscriptionById(id);
    }
    async expireSubscriptions() {
        const today = new Date();
        const expiredSubscriptions = await Subscription_model_1.MemberSubscription.findAll({
            where: {
                status: 'ACTIVE',
                endDate: {
                    [sequelize_1.Op.lt]: today
                }
            }
        });
        for (const subscription of expiredSubscriptions) {
            await subscription.update({ status: 'EXPIRED' });
            // Clear member's current subscription if this was it
            await Member_model_1.Member.update({ currentSubscriptionId: null }, {
                where: {
                    id: subscription.memberId,
                    currentSubscriptionId: subscription.id
                }
            });
        }
        logger_1.logger.info(`Expired ${expiredSubscriptions.length} subscriptions`);
        return expiredSubscriptions.length;
    }
    async getSubscriptionStatistics(params) {
        const { startDate, endDate } = params;
        // Base where clause for date filtering
        const dateWhere = {};
        if (startDate) {
            dateWhere.createdAt = { [sequelize_1.Op.gte]: new Date(startDate) };
        }
        if (endDate) {
            dateWhere.createdAt = { ...dateWhere.createdAt, [sequelize_1.Op.lte]: new Date(endDate) };
        }
        // Get total counts by status
        const totalSubscriptions = await Subscription_model_1.MemberSubscription.count({ where: dateWhere });
        const activeSubscriptions = await Subscription_model_1.MemberSubscription.count({
            where: { ...dateWhere, status: 'ACTIVE' }
        });
        const expiredSubscriptions = await Subscription_model_1.MemberSubscription.count({
            where: { ...dateWhere, status: 'EXPIRED' }
        });
        const pendingSubscriptions = await Subscription_model_1.MemberSubscription.count({
            where: { ...dateWhere, status: 'PENDING' }
        });
        // Calculate revenue
        const revenueResult = await Subscription_model_1.MemberSubscription.findAll({
            where: dateWhere,
            attributes: [
                [Subscription_model_1.MemberSubscription.sequelize.fn('SUM', Subscription_model_1.MemberSubscription.sequelize.col('actual_price')), 'total']
            ],
            raw: true
        });
        const totalRevenue = parseFloat(revenueResult[0]?.total) || 0;
        // Monthly revenue (current month)
        const currentMonth = new Date();
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const monthlyRevenueResult = await Subscription_model_1.MemberSubscription.findAll({
            where: {
                createdAt: {
                    [sequelize_1.Op.between]: [monthStart, monthEnd]
                }
            },
            attributes: [
                [Subscription_model_1.MemberSubscription.sequelize.fn('SUM', Subscription_model_1.MemberSubscription.sequelize.col('actual_price')), 'total']
            ],
            raw: true
        });
        const monthlyRevenue = parseFloat(monthlyRevenueResult[0]?.total) || 0;
        // Package statistics
        const packageStats = await Subscription_model_1.MemberSubscription.findAll({
            where: dateWhere,
            include: [
                {
                    model: Subscription_model_1.MembershipPackage,
                    as: 'package',
                    attributes: ['name']
                }
            ],
            attributes: [
                'packageId',
                [Subscription_model_1.MemberSubscription.sequelize.fn('COUNT', Subscription_model_1.MemberSubscription.sequelize.col('MemberSubscription.id')), 'count'],
                [Subscription_model_1.MemberSubscription.sequelize.fn('SUM', Subscription_model_1.MemberSubscription.sequelize.col('actual_price')), 'revenue']
            ],
            group: ['packageId', 'package.id', 'package.name'],
            raw: false
        });
        const formattedPackageStats = packageStats.map((stat) => ({
            packageName: stat.package.name,
            count: parseInt(stat.dataValues.count),
            revenue: parseFloat(stat.dataValues.revenue)
        }));
        return {
            totalSubscriptions,
            activeSubscriptions,
            expiredSubscriptions,
            pendingSubscriptions,
            totalRevenue,
            monthlyRevenue,
            packageStats: formattedPackageStats
        };
    }
}
exports.SubscriptionService = SubscriptionService;
//# sourceMappingURL=subscription.service.js.map