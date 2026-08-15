'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create some sample subscriptions for the members
    const today = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);

    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);

    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(today.getMonth() + 6);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const twelveMonthsLater = new Date();
    twelveMonthsLater.setMonth(today.getMonth() + 12);

    await queryInterface.bulkInsert('member_subscriptions', [
      // Active subscriptions
      {
        id: 1,
        member_id: 1, // John Doe
        package_id: 2, // 3 month standard package
        start_date: oneMonthAgo.toISOString().split('T')[0],
        end_date: new Date(oneMonthAgo.getTime() + (3 * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        actual_price: 1350000,
        status: 'ACTIVE',
        renewal_reminder_sent: false,
        registered_by: null, // no specific user
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        member_id: 2, // Jane Smith
        package_id: 5, // Personal Training 1 month
        start_date: today.toISOString().split('T')[0],
        end_date: oneMonthLater.toISOString().split('T')[0],
        actual_price: 1200000,
        status: 'ACTIVE',
        renewal_reminder_sent: false,
        registered_by: null, // no specific user
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        member_id: 3, // Alice Johnson
        package_id: 3, // 6 month premium package
        start_date: today.toISOString().split('T')[0],
        end_date: sixMonthsLater.toISOString().split('T')[0],
        actual_price: 2400000,
        status: 'ACTIVE',
        renewal_reminder_sent: false,
        registered_by: null, // no specific user
        created_at: new Date(),
        updated_at: new Date()
      },
      // Pending subscription (waiting for payment)
      {
        id: 5,
        member_id: 1, // John Doe (renewal)
        package_id: 4, // VIP 12 month
        start_date: new Date(oneMonthAgo.getTime() + (3 * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        end_date: twelveMonthsLater.toISOString().split('T')[0],
        actual_price: 4200000,
        status: 'PENDING',
        renewal_reminder_sent: false,
        registered_by: null, // no specific user
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Update members' current subscription references
    await queryInterface.bulkUpdate('members',
      { current_subscription_id: 1 },
      { id: 1 }
    );

    await queryInterface.bulkUpdate('members',
      { current_subscription_id: 2 },
      { id: 2 }
    );

    await queryInterface.bulkUpdate('members',
      { current_subscription_id: 3 },
      { id: 3 }
    );
  },

  async down(queryInterface, Sequelize) {
    // Clear current subscription references
    await queryInterface.bulkUpdate('members',
      { current_subscription_id: null },
      {}
    );

    await queryInterface.bulkDelete('member_subscriptions', {}, {});
  }
};