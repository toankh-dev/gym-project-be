"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("@/models");
const logger_1 = require("@/utils/logger");
class PaymentService {
    // Get paginated payments list with filters
    async getPayments(filters) {
        const { page, limit, status, memberId, paymentType, startDate, endDate } = filters;
        const offset = (page - 1) * limit;
        const whereConditions = {};
        if (status) {
            whereConditions.status = status;
        }
        if (memberId) {
            whereConditions.memberId = parseInt(memberId);
        }
        if (paymentType) {
            whereConditions.paymentMethod = paymentType;
        }
        if (startDate || endDate) {
            whereConditions.createdAt = {};
            if (startDate) {
                whereConditions.createdAt[sequelize_1.Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereConditions.createdAt[sequelize_1.Op.lte] = new Date(endDate);
            }
        }
        // Since we don't have a Payment model yet, simulate payment data
        const totalPayments = 150; // Simulate total count
        const payments = this.generateMockPayments(limit, offset);
        return {
            payments,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalPayments / limit),
                totalItems: totalPayments,
                limit
            }
        };
    }
    // Get payment by ID
    async getPaymentById(paymentId) {
        // Simulate payment retrieval
        return this.generateMockPayment(paymentId);
    }
    // Create new payment record
    async createPayment(paymentData) {
        try {
            // Simulate payment creation
            const payment = {
                id: Math.floor(Math.random() * 10000),
                ...paymentData,
                status: 'SUCCESS',
                transactionId: this.generateTransactionId(),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            logger_1.logger.info('Payment created:', payment);
            return payment;
        }
        catch (error) {
            logger_1.logger.error('Error creating payment:', error);
            throw new Error('Failed to create payment');
        }
    }
    // Update payment status
    async updatePaymentStatus(paymentId, status, notes, updatedBy) {
        try {
            // Simulate payment status update
            const payment = this.generateMockPayment(paymentId);
            if (!payment)
                return null;
            const updatedPayment = {
                ...payment,
                status,
                notes,
                updatedBy,
                updatedAt: new Date()
            };
            logger_1.logger.info('Payment status updated:', updatedPayment);
            return updatedPayment;
        }
        catch (error) {
            logger_1.logger.error('Error updating payment status:', error);
            throw new Error('Failed to update payment status');
        }
    }
    // Simulate payment processing
    async simulatePayment(data) {
        try {
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Simulate payment success/failure (90% success rate)
            const isSuccess = Math.random() > 0.1;
            const result = {
                id: Math.floor(Math.random() * 100000),
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                status: isSuccess ? 'SUCCESS' : 'FAILED',
                transactionId: this.generateTransactionId(),
                subscriptionId: data.subscriptionId,
                processedAt: new Date()
            };
            logger_1.logger.info('Payment simulation completed:', result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Payment simulation failed:', error);
            throw new Error('Payment simulation failed');
        }
    }
    // Get member payments with pagination
    async getMemberPayments(memberId, options) {
        const { limit, offset, status } = options;
        // Simulate member payments
        const payments = this.generateMockPayments(limit, offset, memberId);
        const filteredPayments = status ? payments.filter(p => p.status === status) : payments;
        return {
            payments: filteredPayments,
            totalCount: 25 + memberId // Simulate different counts per member
        };
    }
    // Get member by user ID (for current member payments)
    async getMemberByUserId(userId) {
        try {
            const member = await models_1.Member.findOne({
                where: { userId },
                include: [
                    {
                        model: models_1.User,
                        as: 'user',
                        attributes: ['id', 'email', 'firstName', 'lastName']
                    }
                ]
            });
            return member;
        }
        catch (error) {
            logger_1.logger.error('Error finding member by user ID:', error);
            throw new Error('Failed to find member');
        }
    }
    // Get payment statistics
    async getPaymentStatistics(filters) {
        try {
            const { startDate, endDate, groupBy = 'month' } = filters;
            // Simulate payment statistics
            const stats = {
                totalRevenue: 125000,
                totalPayments: 485,
                averagePayment: 257.73,
                successRate: 94.2,
                paymentMethods: [
                    { method: 'CARD', count: 285, percentage: 58.8 },
                    { method: 'CASH', count: 125, percentage: 25.8 },
                    { method: 'BANK_TRANSFER', count: 55, percentage: 11.3 },
                    { method: 'MOBILE_PAYMENT', count: 20, percentage: 4.1 }
                ],
                timeSeriesData: this.generateTimeSeriesData(groupBy, startDate, endDate)
            };
            return stats;
        }
        catch (error) {
            logger_1.logger.error('Error getting payment statistics:', error);
            throw new Error('Failed to get payment statistics');
        }
    }
    // Process subscription payment
    async processSubscriptionPayment(data) {
        try {
            // Get subscription details
            const subscription = await models_1.MemberSubscription.findByPk(data.subscriptionId, {
                include: [
                    {
                        model: models_1.MembershipPackage,
                        as: 'package'
                    },
                    {
                        model: models_1.Member,
                        as: 'member',
                        include: [
                            {
                                model: models_1.User,
                                as: 'user'
                            }
                        ]
                    }
                ]
            });
            if (!subscription) {
                throw new Error('Subscription not found');
            }
            // Simulate payment processing
            const paymentResult = await this.simulatePayment({
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                subscriptionId: data.subscriptionId
            });
            if (paymentResult.status === 'SUCCESS') {
                // Update subscription payment status
                const paymentRecord = await this.createPayment({
                    memberId: subscription.memberId,
                    subscriptionId: data.subscriptionId,
                    amount: data.amount,
                    paymentMethod: data.paymentMethod,
                    paymentType: 'SUBSCRIPTION',
                    status: 'COMPLETED',
                    transactionId: paymentResult.transactionId,
                    processedBy: data.processedBy,
                    notes: `Subscription payment for ${subscription.package?.name}`
                });
                return {
                    success: true,
                    payment: paymentRecord,
                    subscription: subscription,
                    transactionId: paymentResult.transactionId
                };
            }
            else {
                throw new Error('Payment processing failed');
            }
        }
        catch (error) {
            logger_1.logger.error('Error processing subscription payment:', error);
            throw new Error('Failed to process subscription payment');
        }
    }
    // Private helper methods
    generateTransactionId() {
        return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
    generateMockPayment(id) {
        return {
            id,
            memberId: Math.floor(Math.random() * 100) + 1,
            subscriptionId: Math.floor(Math.random() * 50) + 1,
            amount: Math.floor(Math.random() * 500) + 100,
            paymentMethod: ['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT'][Math.floor(Math.random() * 4)],
            paymentType: ['SUBSCRIPTION', 'PERSONAL_TRAINING', 'MERCHANDISE'][Math.floor(Math.random() * 3)],
            status: ['COMPLETED', 'PENDING', 'FAILED'][Math.floor(Math.random() * 3)],
            transactionId: this.generateTransactionId(),
            notes: 'Simulated payment record',
            processedBy: Math.floor(Math.random() * 10) + 1,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            updatedAt: new Date()
        };
    }
    generateMockPayments(limit, offset, memberId) {
        const payments = [];
        for (let i = 0; i < limit; i++) {
            const payment = this.generateMockPayment(offset + i + 1);
            if (memberId) {
                payment.memberId = memberId;
            }
            payments.push(payment);
        }
        return payments;
    }
    generateTimeSeriesData(groupBy, startDate, endDate) {
        const data = [];
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        let current = new Date(start);
        while (current <= end) {
            data.push({
                date: current.toISOString().split('T')[0],
                revenue: Math.floor(Math.random() * 10000) + 5000,
                payments: Math.floor(Math.random() * 50) + 20
            });
            if (groupBy === 'month') {
                current.setMonth(current.getMonth() + 1);
            }
            else if (groupBy === 'week') {
                current.setDate(current.getDate() + 7);
            }
            else {
                current.setDate(current.getDate() + 1);
            }
        }
        return data;
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=payment.service.js.map