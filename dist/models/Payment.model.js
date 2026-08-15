"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("@/config/database.config"));
class Payment extends sequelize_1.Model {
    id;
    memberId;
    subscriptionId;
    amount;
    paymentMethod;
    paymentType;
    paymentDate;
    paymentStatus;
    transactionReference;
    notes;
    processedBy;
    createdAt;
    updatedAt;
}
exports.Payment = Payment;
Payment.init({
    id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    memberId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'member_id' },
    subscriptionId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'subscription_id' },
    amount: { type: sequelize_1.DataTypes.DECIMAL(10, 2), allowNull: false },
    paymentMethod: {
        type: sequelize_1.DataTypes.ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'E_WALLET'),
        allowNull: false,
        field: 'payment_method',
    },
    paymentType: {
        type: sequelize_1.DataTypes.ENUM('MEMBERSHIP_FEE', 'PERSONAL_TRAINING', 'PRODUCT', 'SERVICE', 'OTHER'),
        allowNull: false,
        field: 'payment_type',
    },
    paymentDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, field: 'payment_date' },
    paymentStatus: {
        type: sequelize_1.DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
        defaultValue: 'PENDING',
        allowNull: false,
        field: 'payment_status',
    },
    transactionReference: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, field: 'transaction_reference' },
    notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    processedBy: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'processed_by' },
}, {
    sequelize: database_config_1.default,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    paranoid: false,
});
//# sourceMappingURL=Payment.model.js.map