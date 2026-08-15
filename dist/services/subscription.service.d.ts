import { MemberSubscription } from '@/models/Subscription.model';
import { Member } from '@/models/Member.model';
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
export declare class SubscriptionService {
    getSubscriptions(filters: SubscriptionFilters): Promise<{
        subscriptions: MemberSubscription[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getSubscriptionById(id: number): Promise<MemberSubscription>;
    getMemberSubscriptions(memberId: number, includeExpired?: boolean): Promise<MemberSubscription[]>;
    getCurrentMemberSubscription(memberId: number): Promise<any>;
    getMemberByUserId(userId: number): Promise<Member>;
    createSubscription(params: CreateSubscriptionParams): Promise<MemberSubscription>;
    updateSubscription(id: number, updates: Partial<MemberSubscription>): Promise<MemberSubscription>;
    cancelSubscription(id: number, reason?: string): Promise<MemberSubscription>;
    renewSubscription(params: RenewSubscriptionParams): Promise<MemberSubscription>;
    activateSubscription(id: number): Promise<MemberSubscription>;
    expireSubscriptions(): Promise<number>;
    getSubscriptionStatistics(params: {
        startDate?: string;
        endDate?: string;
    }): Promise<SubscriptionStatistics>;
}
//# sourceMappingURL=subscription.service.d.ts.map