import { Member, MemberSubscription } from '@/models';
export interface PaymentFilters {
    page: number;
    limit: number;
    status?: string;
    memberId?: string;
    paymentType?: string;
    startDate?: string;
    endDate?: string;
}
export interface PaymentSimulationData {
    amount: number;
    paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT';
    subscriptionId: number;
}
export interface PaymentResult {
    id: number;
    amount: number;
    paymentMethod: string;
    status: 'SUCCESS' | 'FAILED';
    transactionId: string;
    subscriptionId: number;
    processedAt: Date;
}
export interface PaymentStatisticsFilters {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
}
export interface SubscriptionPaymentData {
    subscriptionId: number;
    paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT';
    amount: number;
    processedBy: number;
}
export declare class PaymentService {
    getPayments(filters: PaymentFilters): Promise<{
        payments: any[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            limit: number;
        };
    }>;
    getPaymentById(paymentId: number): Promise<{
        id: number;
        memberId: number;
        subscriptionId: number;
        amount: number;
        paymentMethod: string;
        paymentType: string;
        status: string;
        transactionId: string;
        notes: string;
        processedBy: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createPayment(paymentData: any): Promise<any>;
    updatePaymentStatus(paymentId: number, status: string, notes?: string, updatedBy?: number): Promise<{
        status: string;
        notes: string;
        updatedBy: number;
        updatedAt: Date;
        id: number;
        memberId: number;
        subscriptionId: number;
        amount: number;
        paymentMethod: string;
        paymentType: string;
        transactionId: string;
        processedBy: number;
        createdAt: Date;
    }>;
    simulatePayment(data: PaymentSimulationData): Promise<PaymentResult>;
    getMemberPayments(memberId: number, options: {
        limit: number;
        offset: number;
        status?: string;
    }): Promise<{
        payments: any[];
        totalCount: number;
    }>;
    getMemberByUserId(userId: number): Promise<Member>;
    getPaymentStatistics(filters: PaymentStatisticsFilters): Promise<{
        totalRevenue: number;
        totalPayments: number;
        averagePayment: number;
        successRate: number;
        paymentMethods: {
            method: string;
            count: number;
            percentage: number;
        }[];
        timeSeriesData: any[];
    }>;
    processSubscriptionPayment(data: SubscriptionPaymentData): Promise<{
        success: boolean;
        payment: any;
        subscription: MemberSubscription;
        transactionId: string;
    }>;
    private generateTransactionId;
    private generateMockPayment;
    private generateMockPayments;
    private generateTimeSeriesData;
}
//# sourceMappingURL=payment.service.d.ts.map