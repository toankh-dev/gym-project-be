import { Op } from 'sequelize';
import { MemberSubscription, MembershipPackage } from '@/models/Subscription.model';
import { Member } from '@/models/Member.model';
import { User } from '@/models/User.model';
import { UserProfile } from '@/models/UserProfile.model';
import { Payment } from '@/models/Payment.model';
import { logger } from '@/utils/logger';

export interface CreateSubscriptionParams {
  memberId: number;
  packageId: number;
  startDate: Date;
  registeredBy: number;
  paymentMethod?: string;
}

export interface RenewSubscriptionParams {
  currentSubscriptionId: number;
  newPackageId?: number;
  registeredBy: number;
  paymentMethod?: string;
}

export interface SubscriptionFilters {
  page: number;
  limit: number;
  status?: string;
  memberId?: string;
}

export interface SubscriptionStatistics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  pendingSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  packageStats: Array<{
    packageName: string;
    count: number;
    revenue: number;
  }>;
}

export class SubscriptionService {
  async getSubscriptions(filters: SubscriptionFilters) {
    const { page, limit, status, memberId } = filters;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (memberId) {
      where.memberId = parseInt(memberId);
    }

    const { rows: subscriptions, count: total } = await MemberSubscription.findAndCountAll({
      where,
      include: [
        {
          model: Member,
          as: 'member',
          include: [
            {
              model: User,
              as: 'user',
              include: [
                {
                  model: UserProfile,
                  as: 'profile'
                }
              ]
            }
          ]
        },
        {
          model: MembershipPackage,
          as: 'package'
        },
        {
          model: User,
          as: 'registeredByUser',
          include: [
            {
              model: UserProfile,
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

  async getSubscriptionById(id: number) {
    return await MemberSubscription.findByPk(id, {
      include: [
        {
          model: Member,
          as: 'member',
          include: [
            {
              model: User,
              as: 'user',
              include: [
                {
                  model: UserProfile,
                  as: 'profile'
                }
              ]
            }
          ]
        },
        {
          model: MembershipPackage,
          as: 'package'
        },
        {
          model: User,
          as: 'registeredByUser',
          include: [
            {
              model: UserProfile,
              as: 'profile'
            }
          ]
        }
      ]
    });
  }

  async getMemberSubscriptions(memberId: number, includeExpired: boolean = false) {
    const where: any = { memberId };

    if (!includeExpired) {
      where.status = {
        [Op.in]: ['PENDING', 'ACTIVE']
      };
    }

    return await MemberSubscription.findAll({
      where,
      include: [
        {
          model: MembershipPackage,
          as: 'package'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  async getCurrentMemberSubscription(memberId: number) {
    const subscription: any = await MemberSubscription.findOne({
      where: {
        memberId,
        status: { [Op.in]: ['ACTIVE', 'PENDING'] },
      },
      include: [
        {
          model: MembershipPackage,
          as: 'package'
        }
      ],
      order: [['created_at', 'DESC']] as any,
      raw: true,
      nest: true
    });

    if (subscription) {
      const now = new Date();
      const end = subscription.endDate ? new Date(subscription.endDate) : new Date();
      const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
      const isExpired = end < now;
      return { ...subscription, daysRemaining, isExpired };
    }

    return null;
  }

  async paySubscription(subscriptionId: number, paymentMethod: string, userId: number) {
    const subscription = await MemberSubscription.findByPk(subscriptionId, {
      include: [{ model: MembershipPackage, as: 'package' }]
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status === 'ACTIVE') {
      throw new Error('Gói tập này đã được thanh toán và đang hoạt động.');
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    const durationMonths = subscription.package?.durationMonths || 1;
    endDate.setMonth(endDate.getMonth() + durationMonths);

    await subscription.update({
      status: 'ACTIVE',
      startDate,
      endDate,
    });

    // Update member status
    await Member.update(
      { membershipStatus: 'ACTIVE', currentSubscriptionId: subscription.id },
      { where: { id: subscription.memberId } }
    );

    // Create completed Payment record
    await Payment.create({
      memberId: subscription.memberId,
      subscriptionId: subscription.id,
      amount: subscription.actualPrice,
      paymentMethod: (paymentMethod as any) || 'CASH',
      paymentType: 'MEMBERSHIP_FEE',
      paymentDate: startDate,
      paymentStatus: 'COMPLETED',
      notes: `Thanh toán kích hoạt gói tập ${subscription.package?.name || ''}`,
      processedBy: userId
    });

    return await this.getCurrentMemberSubscription(subscription.memberId);
  }

  async getMemberByUserId(userId: number) {
    return await Member.findOne({
      where: { userId },
      raw: true
    });
  }

  async createSubscription(params: CreateSubscriptionParams) {
    const { memberId, packageId, startDate, registeredBy, paymentMethod } = params;

    // Get package details
    const membershipPackage = await MembershipPackage.findByPk(packageId);
    if (!membershipPackage) {
      throw new Error('Membership package not found');
    }

    if (!membershipPackage.isActive()) {
      throw new Error('Membership package is not active');
    }

    // Check if member exists
    const member = await Member.findByPk(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    // Calculate end date
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + membershipPackage.durationMonths);

    // Check for overlapping active subscriptions
    const existingSubscription = await MemberSubscription.findOne({
      where: {
        memberId,
        status: 'ACTIVE',
        endDate: {
          [Op.gte]: startDate
        }
      }
    });

    if (existingSubscription) {
      throw new Error('Member already has an active subscription that overlaps with the new subscription period');
    }

    // Create subscription
    const subscription = await MemberSubscription.create({
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

    logger.info(`Subscription created for member ${memberId}, package ${packageId}`);

    return await this.getSubscriptionById(subscription.id);
  }

  async updateSubscription(id: number, updates: Partial<MemberSubscription>) {
    const subscription = await MemberSubscription.findByPk(id);
    if (!subscription) {
      return null;
    }

    await subscription.update(updates);
    return await this.getSubscriptionById(id);
  }

  async cancelSubscription(id: number, reason?: string) {
    const subscription = await MemberSubscription.findByPk(id);
    if (!subscription) {
      return null;
    }

    await subscription.update({
      status: 'CANCELLED'
    });

    // TODO: Create cancellation record with reason
    logger.info(`Subscription ${id} cancelled. Reason: ${reason || 'Not provided'}`);

    return await this.getSubscriptionById(id);
  }

  async renewSubscription(params: RenewSubscriptionParams) {
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

    logger.info(`Subscription renewed for member ${memberId}, old subscription ${currentSubscriptionId}, new subscription ${newSubscription.id}`);

    return newSubscription;
  }

  async activateSubscription(id: number) {
    const subscription = await MemberSubscription.findByPk(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status !== 'PENDING') {
      throw new Error('Only pending subscriptions can be activated');
    }

    await subscription.update({ status: 'ACTIVE' });

    // Update member's current subscription
    await Member.update(
      { currentSubscriptionId: id },
      { where: { id: subscription.memberId } }
    );

    logger.info(`Subscription ${id} activated for member ${subscription.memberId}`);

    return await this.getSubscriptionById(id);
  }

  async expireSubscriptions() {
    const today = new Date();

    const expiredSubscriptions = await MemberSubscription.findAll({
      where: {
        status: 'ACTIVE',
        endDate: {
          [Op.lt]: today
        }
      }
    });

    for (const subscription of expiredSubscriptions) {
      await subscription.update({ status: 'EXPIRED' });

      // Clear member's current subscription if this was it
      await Member.update(
        { currentSubscriptionId: null },
        {
          where: {
            id: subscription.memberId,
            currentSubscriptionId: subscription.id
          }
        }
      );
    }

    logger.info(`Expired ${expiredSubscriptions.length} subscriptions`);
    return expiredSubscriptions.length;
  }

  async getSubscriptionStatistics(params: { startDate?: string; endDate?: string }): Promise<SubscriptionStatistics> {
    const { startDate, endDate } = params;

    // Base where clause for date filtering
    const dateWhere: any = {};
    if (startDate) {
      dateWhere.createdAt = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      dateWhere.createdAt = { ...dateWhere.createdAt, [Op.lte]: new Date(endDate) };
    }

    // Get total counts by status
    const totalSubscriptions = await MemberSubscription.count({ where: dateWhere });
    const activeSubscriptions = await MemberSubscription.count({
      where: { ...dateWhere, status: 'ACTIVE' }
    });
    const expiredSubscriptions = await MemberSubscription.count({
      where: { ...dateWhere, status: 'EXPIRED' }
    });
    const pendingSubscriptions = await MemberSubscription.count({
      where: { ...dateWhere, status: 'PENDING' }
    });

    // Calculate revenue
    const revenueResult = await MemberSubscription.findAll({
      where: dateWhere,
      attributes: [
        [MemberSubscription.sequelize!.fn('SUM', MemberSubscription.sequelize!.col('actual_price')), 'total']
      ],
      raw: true
    });

    const totalRevenue = parseFloat((revenueResult[0] as any)?.total as string) || 0;

    // Monthly revenue (current month)
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthlyRevenueResult = await MemberSubscription.findAll({
      where: {
        createdAt: {
          [Op.between]: [monthStart, monthEnd]
        }
      },
      attributes: [
        [MemberSubscription.sequelize!.fn('SUM', MemberSubscription.sequelize!.col('actual_price')), 'total']
      ],
      raw: true
    });

    const monthlyRevenue = parseFloat((monthlyRevenueResult[0] as any)?.total as string) || 0;

    // Package statistics
    const packageStats = await MemberSubscription.findAll({
      where: dateWhere,
      include: [
        {
          model: MembershipPackage,
          as: 'package',
          attributes: ['name']
        }
      ],
      attributes: [
        'packageId',
        [MemberSubscription.sequelize!.fn('COUNT', MemberSubscription.sequelize!.col('MemberSubscription.id')), 'count'],
        [MemberSubscription.sequelize!.fn('SUM', MemberSubscription.sequelize!.col('actual_price')), 'revenue']
      ],
      group: ['packageId', 'package.id', 'package.name'],
      raw: false
    });

    const formattedPackageStats = packageStats.map((stat: any) => ({
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