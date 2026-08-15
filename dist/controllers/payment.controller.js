"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const payment_service_1 = require("@/services/payment.service");
const logger_1 = require("@/utils/logger");
class PaymentController {
    paymentService;
    constructor() {
        this.paymentService = new payment_service_1.PaymentService();
    }
    getPayments = async (req, res) => {
        try {
            const { page = 1, limit = 10, status, memberId, paymentType, startDate, endDate } = req.query;
            const result = await this.paymentService.getPayments({
                page: parseInt(page),
                limit: parseInt(limit),
                status: status,
                memberId: memberId,
                paymentType: paymentType,
                startDate: startDate,
                endDate: endDate
            });
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting payments:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get payments',
                error: error.message
            });
        }
    };
    getPaymentById = async (req, res) => {
        try {
            const { id } = req.params;
            const payment = await this.paymentService.getPaymentById(parseInt(id));
            if (!payment) {
                res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
                return;
            }
            res.json({
                success: true,
                data: payment
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting payment by ID:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get payment',
                error: error.message
            });
        }
    };
    createPayment = async (req, res) => {
        try {
            const paymentData = req.body;
            const user = req.user;
            const payment = await this.paymentService.createPayment({
                ...paymentData,
                processedBy: user.id
            });
            res.status(201).json({
                success: true,
                message: 'Payment created successfully',
                data: payment
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating payment:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create payment',
                error: error.message
            });
        }
    };
    updatePaymentStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;
            const user = req.user;
            const payment = await this.paymentService.updatePaymentStatus(parseInt(id), status, notes, user.id);
            if (!payment) {
                res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Payment status updated successfully',
                data: payment
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating payment status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update payment status',
                error: error.message
            });
        }
    };
    simulatePayment = async (req, res) => {
        try {
            const { amount, paymentMethod, subscriptionId } = req.body;
            const result = await this.paymentService.simulatePayment({
                amount,
                paymentMethod,
                subscriptionId
            });
            res.json({
                success: true,
                message: 'Payment simulation completed',
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Error simulating payment:', error);
            res.status(500).json({
                success: false,
                message: 'Payment simulation failed',
                error: error.message
            });
        }
    };
    getMemberPayments = async (req, res) => {
        try {
            const { memberId } = req.params;
            const { limit = 20, offset = 0, status } = req.query;
            const payments = await this.paymentService.getMemberPayments(parseInt(memberId), {
                limit: parseInt(limit),
                offset: parseInt(offset),
                status: status
            });
            res.json({
                success: true,
                data: payments
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting member payments:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get member payments',
                error: error.message
            });
        }
    };
    getCurrentMemberPayments = async (req, res) => {
        try {
            const user = req.user;
            const member = await this.paymentService.getMemberByUserId(user.id);
            if (!member) {
                res.status(404).json({
                    success: false,
                    message: 'Member profile not found'
                });
                return;
            }
            const { limit = 10, offset = 0 } = req.query;
            const payments = await this.paymentService.getMemberPayments(member.id, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            res.json({
                success: true,
                data: payments
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting current member payments:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get payment history',
                error: error.message
            });
        }
    };
    getPaymentStatistics = async (req, res) => {
        try {
            const { startDate, endDate, groupBy = 'month' } = req.query;
            const stats = await this.paymentService.getPaymentStatistics({
                startDate: startDate,
                endDate: endDate,
                groupBy: groupBy
            });
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting payment statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get payment statistics',
                error: error.message
            });
        }
    };
    processSubscriptionPayment = async (req, res) => {
        try {
            const { subscriptionId, paymentMethod, amount } = req.body;
            const user = req.user;
            const result = await this.paymentService.processSubscriptionPayment({
                subscriptionId: parseInt(subscriptionId),
                paymentMethod,
                amount,
                processedBy: user.id
            });
            res.json({
                success: true,
                message: 'Subscription payment processed successfully',
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Error processing subscription payment:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process subscription payment',
                error: error.message
            });
        }
    };
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=payment.controller.js.map