'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('member_preferences', [
      {
        id: 1,
        member_id: 1,
        notify_email: true,
        notify_sms: false,
        notify_push: true,
        notify_workout_reminders: true,
        notify_subscription_expiry: true,
        notify_trainer_messages: true,
        profile_visibility: 'MEMBERS_ONLY',
        show_progress: true,
        show_stats: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        member_id: 2,
        notify_email: true,
        notify_sms: true,
        notify_push: false,
        notify_workout_reminders: true,
        notify_subscription_expiry: true,
        notify_trainer_messages: false,
        profile_visibility: 'PRIVATE',
        show_progress: false,
        show_stats: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        member_id: 3,
        notify_email: false,
        notify_sms: false,
        notify_push: true,
        notify_workout_reminders: false,
        notify_subscription_expiry: true,
        notify_trainer_messages: true,
        profile_visibility: 'PUBLIC',
        show_progress: true,
        show_stats: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('member_preferences', {});
  }
};
