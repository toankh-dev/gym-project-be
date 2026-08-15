import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database.config';

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

export interface PaymentCreationAttributes
  extends Optional<PaymentAttributes,
    'id' | 'subscriptionId' | 'transactionReference' | 'notes' | 'processedBy' | 'createdAt' | 'updatedAt'> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  declare id: number;
  declare memberId: number;
  declare subscriptionId?: number;
  declare amount: number;
  declare paymentMethod: PaymentAttributes['paymentMethod'];
  declare paymentType: PaymentAttributes['paymentType'];
  declare paymentDate: Date;
  declare paymentStatus: PaymentAttributes['paymentStatus'];
  declare transactionReference?: string;
  declare notes?: string;
  declare processedBy?: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Payment.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    memberId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'member_id' },
    subscriptionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'subscription_id' },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paymentMethod: {
      type: DataTypes.ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'E_WALLET'),
      allowNull: false,
      field: 'payment_method',
    },
    paymentType: {
      type: DataTypes.ENUM('MEMBERSHIP_FEE', 'PERSONAL_TRAINING', 'PRODUCT', 'SERVICE', 'OTHER'),
      allowNull: false,
      field: 'payment_type',
    },
    paymentDate: { type: DataTypes.DATE, allowNull: false, field: 'payment_date' },
    paymentStatus: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
      defaultValue: 'PENDING',
      allowNull: false,
      field: 'payment_status',
    },
    transactionReference: { type: DataTypes.STRING(100), allowNull: true, field: 'transaction_reference' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    processedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'processed_by' },
  } as any,
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    paranoid: false,
  },
);
