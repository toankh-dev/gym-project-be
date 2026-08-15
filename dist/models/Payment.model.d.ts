import { Model, Optional } from 'sequelize';
export interface PaymentAttributes {
    id: number;
    memberId: number;
    subscriptionId?: number;
    amount: number;
    paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'E_WALLET';
    paymentType: 'MEMBERSHIP_FEE' | 'PERSONAL_TRAINING' | 'PRODUCT' | 'SERVICE' | 'OTHER';
    paymentDate: Date;
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    transactionReference?: string;
    notes?: string;
    processedBy?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'subscriptionId' | 'transactionReference' | 'notes' | 'processedBy' | 'createdAt' | 'updatedAt'> {
}
export declare class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
    id: number;
    memberId: number;
    subscriptionId?: number;
    amount: number;
    paymentMethod: PaymentAttributes['paymentMethod'];
    paymentType: PaymentAttributes['paymentType'];
    paymentDate: Date;
    paymentStatus: PaymentAttributes['paymentStatus'];
    transactionReference?: string;
    notes?: string;
    processedBy?: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
//# sourceMappingURL=Payment.model.d.ts.map