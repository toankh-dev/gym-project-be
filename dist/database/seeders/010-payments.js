'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        const today = new Date();
        const daysAgo = (n) => {
            const d = new Date();
            d.setDate(today.getDate() - n);
            return d;
        };
        await queryInterface.bulkInsert('payments', [
            {
                id: 1,
                member_id: 1,
                subscription_id: 1,
                amount: 1350000,
                payment_method: 'BANK_TRANSFER',
                payment_type: 'MEMBERSHIP_FEE',
                payment_date: daysAgo(30),
                payment_status: 'COMPLETED',
                transaction_reference: 'TXN-2026-0001',
                notes: '3-month standard package',
                processed_by: 2,
                created_at: daysAgo(30),
                updated_at: daysAgo(30)
            },
            {
                id: 2,
                member_id: 2,
                subscription_id: 2,
                amount: 1200000,
                payment_method: 'CREDIT_CARD',
                payment_type: 'PERSONAL_TRAINING',
                payment_date: daysAgo(5),
                payment_status: 'COMPLETED',
                transaction_reference: 'TXN-2026-0002',
                notes: 'Personal training 1 month',
                processed_by: 2,
                created_at: daysAgo(5),
                updated_at: daysAgo(5)
            },
            {
                id: 3,
                member_id: 3,
                subscription_id: 3,
                amount: 2400000,
                payment_method: 'E_WALLET',
                payment_type: 'MEMBERSHIP_FEE',
                payment_date: daysAgo(2),
                payment_status: 'COMPLETED',
                transaction_reference: 'TXN-2026-0003',
                notes: '6-month premium package',
                processed_by: 1,
                created_at: daysAgo(2),
                updated_at: daysAgo(2)
            },
            {
                id: 4,
                member_id: 1,
                subscription_id: 5,
                amount: 4200000,
                payment_method: 'BANK_TRANSFER',
                payment_type: 'MEMBERSHIP_FEE',
                payment_date: today,
                payment_status: 'PENDING',
                transaction_reference: 'TXN-2026-0004',
                notes: 'VIP 12-month renewal - awaiting confirmation',
                processed_by: null,
                created_at: today,
                updated_at: today
            },
            {
                id: 5,
                member_id: 2,
                subscription_id: null,
                amount: 350000,
                payment_method: 'CASH',
                payment_type: 'PRODUCT',
                payment_date: daysAgo(10),
                payment_status: 'COMPLETED',
                transaction_reference: 'TXN-2026-0005',
                notes: 'Protein supplement purchase',
                processed_by: 2,
                created_at: daysAgo(10),
                updated_at: daysAgo(10)
            },
            {
                id: 6,
                member_id: 3,
                subscription_id: null,
                amount: 150000,
                payment_method: 'DEBIT_CARD',
                payment_type: 'SERVICE',
                payment_date: daysAgo(15),
                payment_status: 'REFUNDED',
                transaction_reference: 'TXN-2026-0006',
                notes: 'Cancelled locker rental - refunded',
                processed_by: 2,
                created_at: daysAgo(15),
                updated_at: daysAgo(15)
            }
        ]);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('payments', {});
    }
};
//# sourceMappingURL=010-payments.js.map