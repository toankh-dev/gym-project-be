import { Request, Response } from 'express';
import { PaymentService } from '@/services/payment.service';
import { logger } from '@/utils/logger';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  public getPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, status, memberId, paymentType, startDate, endDate } = req.query;

      const result = await this.paymentService.getPayments({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        memberId: memberId as string,
        paymentType: paymentType as string,
        startDate: startDate as string,
        endDate: endDate as string
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Error getting payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payments',
        error: error.message
      });
    }
  };

  public getPaymentById = async (req: Request, res: Response): Promise<void> => {
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
    } catch (error: any) {
      logger.error('Error getting payment by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment',
        error: error.message
      });
    }
  };

  public createPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const paymentData = req.body;
      const user = (req as any).user;

      const payment = await this.paymentService.createPayment({
        ...paymentData,
        processedBy: user.id
      });

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: payment
      });
    } catch (error: any) {
      logger.error('Error creating payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment',
        error: error.message
      });
    }
  };

  public updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const user = (req as any).user;

      const payment = await this.paymentService.updatePaymentStatus(
        parseInt(id),
        status,
        notes,
        user.id
      );

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
    } catch (error: any) {
      logger.error('Error updating payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment status',
        error: error.message
      });
    }
  };

  public simulatePayment = async (req: Request, res: Response): Promise<void> => {
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
    } catch (error: any) {
      logger.error('Error simulating payment:', error);
      res.status(500).json({
        success: false,
        message: 'Payment simulation failed',
        error: error.message
      });
    }
  };

  public getMemberPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { memberId } = req.params;
      const { limit = 20, offset = 0, status } = req.query;

      const payments = await this.paymentService.getMemberPayments(parseInt(memberId), {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        status: status as string
      });

      res.json({
        success: true,
        data: payments
      });
    } catch (error: any) {
      logger.error('Error getting member payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get member payments',
        error: error.message
      });
    }
  };

  public getCurrentMemberPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
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
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({
        success: true,
        data: payments
      });
    } catch (error: any) {
      logger.error('Error getting current member payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment history',
        error: error.message
      });
    }
  };

  public getPaymentStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate, groupBy = 'month' } = req.query;

      const stats = await this.paymentService.getPaymentStatistics({
        startDate: startDate as string,
        endDate: endDate as string,
        groupBy: groupBy as string
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Error getting payment statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment statistics',
        error: error.message
      });
    }
  };

  public processSubscriptionPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { subscriptionId, paymentMethod, amount } = req.body;
      const user = (req as any).user;

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
    } catch (error: any) {
      logger.error('Error processing subscription payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process subscription payment',
        error: error.message
      });
    }
  };
}