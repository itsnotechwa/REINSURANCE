/**
 * Performance Testing Script for Reinsurance Claims Management System
 * Tests response times and performance metrics using Node.js
 */

// Ensure fetch is available (Node.js 18+ has native fetch)
if (typeof fetch === 'undefined') {
  console.error('Error: fetch is not available. Please use Node.js 18 or higher.');
  process.exit(1);
}

const BASE_URL = 'http://127.0.0.1:5000';
const FRONTEND_URL = 'http://localhost:5173';

// Test configuration
const VIRTUAL_USERS = 20;
const TEST_DURATION = 30; // seconds

// Performance thresholds
const THRESHOLDS = {
  loginPage: 500,      // ms
  dashboard: 600,      // ms
  claimsList: 600,     // ms
  uploadPage: 800,     // ms
  apiResponse: 1000    // ms
};

const performanceResults = [];

function logPerformance(testName, duration, threshold) {
  const passed = duration <= threshold;
  const result = {
    testName,
    duration,
    status: passed ? 'PASSED' : 'FAILED',
    threshold,
    timestamp: new Date().toISOString()
  };
  performanceResults.push(result);
  
  const statusIcon = result.status === 'PASSED' ? '✓' : '✗';
  console.log(`${statusIcon} ${testName}: ${duration}ms (threshold: ${threshold}ms)`);
  
  return passed;
}

async function measureResponseTime(url, options = {}) {
  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const endTime = Date.now();
    return {
      response,
      duration: endTime - startTime,
      success: response.ok
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      response: null,
      duration: endTime - startTime,
      success: false,
      error: error.message
    };
  }
}

// TC07: Load Admin Dashboard Performance
async function testAdminDashboardLoad() {
  console.log('\n=== TC07: Testing Admin Dashboard Load Performance ===');
  
  // First login
  const loginResult = await measureResponseTime(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@test.com',
      password: 'admin123'
    })
  });

  if (!loginResult.success) {
    console.log('✗ Failed to login for dashboard test');
    return false;
  }

  // Test dashboard API endpoint
  const dashboardResult = await measureResponseTime(`${BASE_URL}/claim/report`, {
    method: 'GET'
  });

  const passed = logPerformance(
    'Admin Dashboard Load',
    dashboardResult.duration,
    THRESHOLDS.dashboard
  );

  return passed;
}

// TC08: Submit Claim Performance
async function testClaimSubmissionPerformance() {
  console.log('\n=== TC08: Testing Claim Submission Performance ===');
  
  // Login first
  const loginResult = await measureResponseTime(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'insurer@test.com',
      password: 'insurer123'
    })
  });

  if (!loginResult.success) {
    console.log('✗ Failed to login for claim submission test');
    return false;
  }

  // Create a mock PDF file for upload
  const formData = new FormData();
  const blob = new Blob(['mock pdf content'], { type: 'application/pdf' });
  formData.append('file', blob, 'test-claim.pdf');

  const startTime = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/claim/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    const endTime = Date.now();
    const duration = endTime - startTime;

    const passed = logPerformance(
      'Claim Submission',
      duration,
      THRESHOLDS.apiResponse
    );

    return passed;
  } catch (error) {
    const endTime = Date.now();
    logPerformance(
      'Claim Submission',
      endTime - startTime,
      'FAILED',
      THRESHOLDS.apiResponse
    );
    return false;
  }
}

// TC09: Login Page Performance
async function testLoginPagePerformance() {
  console.log('\n=== TC09: Testing Login Page Performance ===');
  
  const result = await measureResponseTime(`${BASE_URL}/auth/login`, {
    method: 'GET'
  });

  // For login page, we might test the frontend, so test a simple endpoint
  const loginEndpointResult = await measureResponseTime(`${BASE_URL}/auth/profile`, {
    method: 'GET'
  });

  // This should fail (401) but quickly - we're testing performance, not success
  const passed = logPerformance(
    'Login Page Response',
    loginEndpointResult.duration,
    THRESHOLDS.loginPage
  );

  return passed;
}

// TC10: Claims List Performance
async function testClaimsListPerformance() {
  console.log('\n=== TC10: Testing Claims List Performance ===');
  
  // Login first
  const loginResult = await measureResponseTime(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'insurer@test.com',
      password: 'insurer123'
    })
  });

  if (!loginResult.success) {
    console.log('✗ Failed to login for claims list test');
    return false;
  }

  // Test claims list endpoint
  const claimsResult = await measureResponseTime(`${BASE_URL}/claim/claims?page=1&limit=10`, {
    method: 'GET'
  });

  const passed = logPerformance(
    'Claims List Load',
    claimsResult.duration,
    THRESHOLDS.claimsList
  );

  return passed;
}

// Run performance tests
async function runPerformanceTests() {
  console.log('========================================');
  console.log('Performance Test Suite');
  console.log('Reinsurance Claims Management System');
  console.log('========================================\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 4,
    averageResponseTime: 0,
    totalResponseTime: 0
  };

  if (await testLoginPagePerformance()) results.passed++; else results.failed++;
  if (await testAdminDashboardLoad()) results.passed++; else results.failed++;
  if (await testClaimSubmissionPerformance()) results.passed++; else results.failed++;
  if (await testClaimsListPerformance()) results.passed++; else results.failed++;

  // Calculate average response time
  performanceResults.forEach(result => {
    results.totalResponseTime += result.duration;
  });
  results.averageResponseTime = results.totalResponseTime / performanceResults.length;

  console.log('\n========================================');
  console.log('Performance Test Summary');
  console.log('========================================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Average Response Time: ${results.averageResponseTime.toFixed(2)}ms`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  return results;
}

// Export for use in other scripts or run directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runPerformanceTests, performanceResults };
} else {
  // Run tests if executed directly
  runPerformanceTests().catch(console.error);
}

