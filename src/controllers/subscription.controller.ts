import { Request, Response } from 'express';
import { SubscriptionService } from '@/services/subscription.service';
import { logger } from '@/utils/logger';

export class SubscriptionController {
  private subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  public getSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, status, memberId } = req.query;

      const result = await this.subscriptionService.getSubscriptions({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        memberId: memberId as string
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Error getting subscriptions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get subscriptions',
        error: error.message
      });
    }
  };

  public getSubscriptionById = async (req: Request, res: Response): Promise<void> => {
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
    } catch (error: any) {
      logger.error('Error getting subscription by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get subscription',
        error: error.message
      });
    }
  };

  public getMemberSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { memberId } = req.params;
      const { includeExpired = false } = req.query;

      const subscriptions = await this.subscriptionService.getMemberSubscriptions(
        parseInt(memberId),
        includeExpired === 'true'
      );

      res.json({
        success: true,
        data: subscriptions
      });
    } catch (error: any) {
      logger.error('Error getting member subscriptions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get member subscriptions',
        error: error.message
      });
    }
  };

  public getCurrentMemberSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

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
    } catch (error: any) {
      logger.error('Error getting current member subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get current subscription',
        error: error.message
      });
    }
  };

  public createSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const { memberId, packageId, startDate, paymentMethod } = req.body;
      const user = (req as any).user;

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
    } catch (error: any) {
      logger.error('Error creating subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create subscription',
        error: error.message
      });
    }
  };

  public updateSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const subscription = await this.subscriptionService.updateSubscription(
        parseInt(id),
        updates
      );

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
    } catch (error: any) {
      logger.error('Error updating subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update subscription',
        error: error.message
      });
    }
  };

  public cancelSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const subscription = await this.subscriptionService.cancelSubscription(
        parseInt(id),
        reason
      );

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
    } catch (error: any) {
      logger.error('Error cancelling subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription',
        error: error.message
      });
    }
  };

  public renewSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { packageId, paymentMethod } = req.body;
      const user = (req as any).user;

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
    } catch (error: any) {
      logger.error('Error renewing subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to renew subscription',
        error: error.message
      });
    }
  };

  public paySubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { paymentMethod = 'CASH' } = req.body;
      const user = (req as any).user;

      const subscription = await this.subscriptionService.paySubscription(
        parseInt(id),
        paymentMethod,
        user.id
      );

      res.json({
        success: true,
        message: 'Thanh toán kích hoạt gói tập thành công!',
        data: subscription
      });
    } catch (error: any) {
      logger.error('Error paying subscription:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Không thể thanh toán gói tập',
        error: error.message
      });
    }
  };

  public getSubscriptionStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      const stats = await this.subscriptionService.getSubscriptionStatistics({
        startDate: startDate as string,
        endDate: endDate as string
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Error getting subscription statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get subscription statistics',
        error: error.message
      });
    }
  };
}