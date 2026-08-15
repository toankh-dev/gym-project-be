'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('membership_packages', [
      {
        id: 1,
        name: 'Gói Cơ Bản - 1 Tháng',
        duration_months: 1,
        price: 500000,
        description: 'Gói tập cơ bản trong 1 tháng với đầy đủ thiết bị gym',
        benefits: 'Sử dụng tất cả thiết bị gym • Tủ đồ miễn phí • Wifi miễn phí',
        max_sessions: null,
        allow_trainer: false,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        name: 'Gói Tiêu Chuẩn - 3 Tháng',
        duration_months: 3,
        price: 1350000,
        description: 'Gói tập 3 tháng với giá ưu đãi',
        benefits: 'Sử dụng tất cả thiết bị gym • Tủ đồ miễn phí • Wifi miễn phí • 1 buổi tư vấn dinh dưỡng',
        max_sessions: null,
        allow_trainer: false,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        name: 'Gói Cao Cấp - 6 Tháng',
        duration_months: 6,
        price: 2400000,
        description: 'Gói tập 6 tháng với nhiều ưu đãi',
        benefits: 'Sử dụng tất cả thiết bị gym • Tủ đồ miễn phí • Wifi miễn phí • 3 buổi tư vấn dinh dưỡng • Đánh giá thể trạng định kỳ',
        max_sessions: null,
        allow_trainer: false,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        name: 'Gói VIP - 12 Tháng',
        duration_months: 12,
        price: 4200000,
        description: 'Gói tập cả năm với ưu đãi tốt nhất',
        benefits: 'Sử dụng tất cả thiết bị gym • Tủ đồ miễn phí • Wifi miễn phí • Tư vấn dinh dưỡng không giới hạn • Đánh giá thể trạng hàng tháng • Ưu tiên đặt lịch',
        max_sessions: null,
        allow_trainer: false,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 5,
        name: 'Gói Personal Training - 1 Tháng',
        duration_months: 1,
        price: 1200000,
        description: 'Gói tập với huấn luyện viên cá nhân',
        benefits: 'Sử dụng tất cả thiết bị gym • Tủ đồ miễn phí • 8 buổi PT • Kế hoạch tập luyện cá nhân • Tư vấn dinh dưỡng',
        max_sessions: 8,
        allow_trainer: true,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 6,
        name: 'Gói Personal Training - 3 Tháng',
        duration_months: 3,
        price: 3200000,
        description: 'Gói tập 3 tháng với huấn luyện viên cá nhân',
        benefits: 'Sử dụng tất cả thiết bị gym • Tủ đồ miễn phí • 24 buổi PT • Kế hoạch tập luyện cá nhân • Tư vấn dinh dưỡng • Theo dõi tiến độ',
        max_sessions: 24,
        allow_trainer: true,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 7,
        name: 'Gói Học Sinh - Sinh Viên',
        duration_months: 1,
        price: 300000,
        description: 'Gói ưu đãi đặc biệt cho học sinh, sinh viên',
        benefits: 'Sử dụng tất cả thiết bị gym • Tủ đồ miễn phí • Thời gian tập: 6h-14h các ngày trong tuần',
        max_sessions: null,
        allow_trainer: false,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 8,
        name: 'Gói Doanh Nghiệp',
        duration_months: 12,
        price: 3600000,
        description: 'Gói tập cho nhân viên doanh nghiệp',
        benefits: 'Sử dụng tất cả thiết bị gym • Tủ đồ miễn phí • Lớp aerobic nhóm • Tư vấn sức khỏe định kỳ',
        max_sessions: null,
        allow_trainer: false,
        status: 'INACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('membership_packages', {}, {});
  }
};