const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Create axios instance
const api = axios.create(testConfig);

// Test credentials
const testCredentials = {
  admin: { email: 'admin@gym.com', password: 'password123' },
  staff: { email: 'staff1@gym.com', password: 'password123' },
  trainer: { email: 'trainer1@gym.com', password: 'password123' },
  member: { email: 'member1@gym.com', password: 'password123' }
};

// Store tokens for authenticated requests
let tokens = {};

// Helper function to add token to requests
const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to log test results
const logTest = (testName, success, error = null) => {
  if (success) {
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName}: ${error?.message || 'Unknown error'}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error?.message || 'Unknown error' });
  }
};

// Authentication Tests
const testAuthentication = async () => {
  console.log('\n🔐 Testing Authentication APIs...');

  try {
    // Test Admin Login
    const adminLogin = await api.post('/auth/login', testCredentials.admin);
    tokens.admin = adminLogin.data.data.tokens.accessToken;
    logTest('Admin Login', true);

    // Test Staff Login
    const staffLogin = await api.post('/auth/login', testCredentials.staff);
    tokens.staff = staffLogin.data.data.tokens.accessToken;
    logTest('Staff Login', true);

    // Test Trainer Login
    const trainerLogin = await api.post('/auth/login', testCredentials.trainer);
    tokens.trainer = trainerLogin.data.data.tokens.accessToken;
    logTest('Trainer Login', true);

    // Test Member Login
    const memberLogin = await api.post('/auth/login', testCredentials.member);
    tokens.member = memberLogin.data.data.tokens.accessToken;
    logTest('Member Login', true);

  } catch (error) {
    logTest('Authentication', false, error);
  }
};

// User Management Tests
const testUserManagement = async () => {
  console.log('\n👥 Testing User Management APIs...');

  try {
    setAuthToken(tokens.admin);

    // Get all users
    const users = await api.get('/users');
    logTest('Get Users', users.status === 200);

    // Get user by ID
    const user = await api.get('/users/1');
    logTest('Get User by ID', user.status === 200);

    // Get user statistics
    const userStats = await api.get('/users/statistics');
    logTest('Get User Statistics', userStats.status === 200);

  } catch (error) {
    logTest('User Management', false, error);
  }
};

// Member Management Tests
const testMemberManagement = async () => {
  console.log('\n🏃 Testing Member Management APIs...');

  try {
    setAuthToken(tokens.admin);

    // Get all members
    const members = await api.get('/members');
    logTest('Get Members', members.status === 200);

    // Get member by ID
    const member = await api.get('/members/1');
    logTest('Get Member by ID', member.status === 200);

    // Get member statistics
    const memberStats = await api.get('/members/statistics');
    logTest('Get Member Statistics', memberStats.status === 200);

    // Test member self-access
    setAuthToken(tokens.member);
    const myProfile = await api.get('/members/me');
    logTest('Member Get Own Profile', myProfile.status === 200);

  } catch (error) {
    logTest('Member Management', false, error);
  }
};

// Trainer Management Tests
const testTrainerManagement = async () => {
  console.log('\n🏋️ Testing Trainer Management APIs...');

  try {
    setAuthToken(tokens.admin);

    // Get all trainers
    const trainers = await api.get('/trainers');
    logTest('Get Trainers', trainers.status === 200);

    // Get active trainers
    const activeTrainers = await api.get('/trainers/active');
    logTest('Get Active Trainers', activeTrainers.status === 200);

    // Get trainer by ID
    const trainer = await api.get('/trainers/1');
    logTest('Get Trainer by ID', trainer.status === 200);

    // Get specializations
    const specializations = await api.get('/trainers/specializations');
    logTest('Get Specializations', specializations.status === 200);

    // Test trainer self-access
    setAuthToken(tokens.trainer);
    const myTrainerProfile = await api.get('/trainers/me');
    logTest('Trainer Get Own Profile', myTrainerProfile.status === 200);

  } catch (error) {
    logTest('Trainer Management', false, error);
  }
};

// Package Management Tests
const testPackageManagement = async () => {
  console.log('\n📦 Testing Package Management APIs...');

  try {
    setAuthToken(tokens.admin);

    // Get all packages
    const packages = await api.get('/packages');
    logTest('Get Packages', packages.status === 200);

    // Get active packages
    const activePackages = await api.get('/packages/active');
    logTest('Get Active Packages', activePackages.status === 200);

    // Get package by ID
    const package1 = await api.get('/packages/1');
    logTest('Get Package by ID', package1.status === 200);

  } catch (error) {
    logTest('Package Management', false, error);
  }
};

// Subscription Management Tests
const testSubscriptionManagement = async () => {
  console.log('\n📅 Testing Subscription Management APIs...');

  try {
    setAuthToken(tokens.admin);

    // Get all subscriptions
    const subscriptions = await api.get('/subscriptions');
    logTest('Get Subscriptions', subscriptions.status === 200);

    // Get subscription by ID
    const subscription = await api.get('/subscriptions/1');
    logTest('Get Subscription by ID', subscription.status === 200);

    // Get subscription statistics
    const subStats = await api.get('/subscriptions/statistics');
    logTest('Get Subscription Statistics', subStats.status === 200);

    // Test member subscription access
    setAuthToken(tokens.member);
    const mySubscription = await api.get('/subscriptions/my/current');
    logTest('Member Get Current Subscription', mySubscription.status === 200);

  } catch (error) {
    logTest('Subscription Management', false, error);
  }
};

// Schedule Management Tests
const testScheduleManagement = async () => {
  console.log('\n📋 Testing Schedule Management APIs...');

  try {
    setAuthToken(tokens.admin);

    // Get training schedules
    const schedules = await api.get('/schedules/training-schedules');
    logTest('Get Training Schedules', schedules.status === 200);

    // Get upcoming schedules
    const upcomingSchedules = await api.get('/schedules/training-schedules/upcoming');
    logTest('Get Upcoming Schedules', upcomingSchedules.status === 200);

    // Get schedule by ID
    const schedule = await api.get('/schedules/training-schedules/1');
    logTest('Get Schedule by ID', schedule.status === 200);

    // Get attendance logs
    const attendanceLogs = await api.get('/schedules/attendance/logs');
    logTest('Get Attendance Logs', attendanceLogs.status === 200);

    // Test trainer schedule access
    setAuthToken(tokens.trainer);
    const mySchedules = await api.get('/schedules/trainer/my-schedules');
    logTest('Trainer Get Own Schedules', mySchedules.status === 200);

  } catch (error) {
    logTest('Schedule Management', false, error);
  }
};

// Progress Tracking Tests
const testProgressTracking = async () => {
  console.log('\n📊 Testing Progress Tracking APIs...');

  try {
    setAuthToken(tokens.admin);

    // Get exercises
    const exercises = await api.get('/progress/exercises');
    logTest('Get Exercises', exercises.status === 200);

    // Get exercise by ID
    const exercise = await api.get('/progress/exercises/1');
    logTest('Get Exercise by ID', exercise.status === 200);

    // Get member progress
    const memberProgress = await api.get('/progress/member/1');
    logTest('Get Member Progress', memberProgress.status === 200);

    // Get workout analytics
    const workoutAnalytics = await api.get('/progress/workout-analytics');
    logTest('Get Workout Analytics', workoutAnalytics.status === 200);

    // Test member progress access
    setAuthToken(tokens.member);
    const myProgress = await api.get('/progress/my-progress');
    logTest('Member Get Own Progress', myProgress.status === 200);

    const myWorkoutHistory = await api.get('/progress/workout-history');
    logTest('Member Get Workout History', myWorkoutHistory.status === 200);

  } catch (error) {
    logTest('Progress Tracking', false, error);
  }
};

// Payment Management Tests
const testPaymentManagement = async () => {
  console.log('\n💳 Testing Payment Management APIs...');

  try {
    setAuthToken(tokens.admin);

    // Get payments
    const payments = await api.get('/payments');
    logTest('Get Payments', payments.status === 200);

    // Get payment statistics
    const paymentStats = await api.get('/payments/statistics');
    logTest('Get Payment Statistics', paymentStats.status === 200);

    // Test payment simulation
    const simulationData = {
      amount: 1000000,
      paymentMethod: 'CARD',
      subscriptionId: 1
    };
    const simulation = await api.post('/payments/simulate', simulationData);
    logTest('Payment Simulation', simulation.status === 200);

    // Test member payment access
    setAuthToken(tokens.member);
    const myPayments = await api.get('/payments/my-payments');
    logTest('Member Get Own Payments', myPayments.status === 200);

  } catch (error) {
    logTest('Payment Management', false, error);
  }
};

// Analytics Tests
const testAnalytics = async () => {
  console.log('\n📈 Testing Analytics APIs...');

  try {
    setAuthToken(tokens.admin);

    // Get dashboard stats
    const dashboardStats = await api.get('/analytics/dashboard');
    logTest('Get Dashboard Statistics', dashboardStats.status === 200);

    // Get revenue stats
    const revenueStats = await api.get('/analytics/revenue');
    logTest('Get Revenue Statistics', revenueStats.status === 200);

    // Get member growth stats
    const memberGrowthStats = await api.get('/analytics/member-growth');
    logTest('Get Member Growth Statistics', memberGrowthStats.status === 200);

  } catch (error) {
    logTest('Analytics', false, error);
  }
};

// Health Check Test
const testHealthCheck = async () => {
  console.log('\n🏥 Testing Health Check...');

  try {
    const health = await api.get('/health');
    logTest('Health Check', health.status === 200);
  } catch (error) {
    logTest('Health Check', false, error);
  }
};

// Create Test Data
const createTestData = async () => {
  console.log('\n🗃️ Testing Data Creation...');

  try {
    setAuthToken(tokens.admin);

    // Create new member
    const newMemberData = {
      username: 'testmember',
      email: 'testmember@gym.com',
      password: 'password123',
      fullName: 'Test Member',
      phone: '0901111111',
      dateOfBirth: '1995-01-01',
      gender: 'MALE',
      address: 'Test Address'
    };

    const newMember = await api.post('/members', newMemberData);
    logTest('Create New Member', newMember.status === 201);

    // Create new exercise
    const newExerciseData = {
      name: 'Test Exercise',
      category: 'STRENGTH',
      muscleGroup: 'CHEST',
      difficultyLevel: 'BEGINNER',
      description: 'Test exercise for API testing',
      instructions: 'Follow test instructions'
    };

    const newExercise = await api.post('/progress/exercises', newExerciseData);
    logTest('Create New Exercise', newExercise.status === 201);

    // Create new training schedule
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const newScheduleData = {
      trainerId: 1,
      title: 'Test Training Session',
      description: 'API test training session',
      startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0, 0).toISOString(),
      endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0, 0).toISOString(),
      maxParticipants: 5
    };

    const newSchedule = await api.post('/schedules/training-schedules', newScheduleData);
    logTest('Create New Schedule', newSchedule.status === 201);

  } catch (error) {
    logTest('Data Creation', false, error);
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting API Tests...\n');
  console.log(`Testing API at: ${BASE_URL}`);

  try {
    await testHealthCheck();
    await testAuthentication();
    await testUserManagement();
    await testMemberManagement();
    await testTrainerManagement();
    await testPackageManagement();
    await testSubscriptionManagement();
    await testScheduleManagement();
    await testProgressTracking();
    await testPaymentManagement();
    await testAnalytics();
    await createTestData();

    // Print summary
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);

    if (testResults.errors.length > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.errors.forEach(error => {
        console.log(`   • ${error.test}: ${error.error}`);
      });
    }

    console.log('\n🎉 API Testing Completed!');

  } catch (error) {
    console.error('💥 Test runner error:', error.message);
    process.exit(1);
  }
};

// Run tests if this script is called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testAuthentication,
  testUserManagement,
  testMemberManagement,
  testTrainerManagement,
  testPackageManagement,
  testSubscriptionManagement,
  testScheduleManagement,
  testProgressTracking,
  testPaymentManagement,
  testAnalytics,
  testHealthCheck,
  createTestData
};