/**
 * Authentication Testing Script for Reinsurance Claims Management System
 * Tests login, logout, role-based access, and session management
 */

const BASE_URL = 'http://127.0.0.1:5000';
const FRONTEND_URL = 'http://localhost:5173';

// Test credentials
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'admin123';
const INSURER_EMAIL = 'insurer@test.com';
const INSURER_PASSWORD = 'insurer123';
const INVALID_EMAIL = 'wrong@user.com';
const INVALID_PASSWORD = 'wrongpassword';

// Test results storage
const testResults = [];

function logTest(testId, scenario, status, message) {
  const result = {
    testId,
    scenario,
    status,
    message,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  console.log(`[${status}] ${testId}: ${scenario} - ${message}`);
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    return response;
  } catch (error) {
    return { ok: false, status: 0, error: error.message };
  }
}

// TC01: Test invalid login credentials
async function testInvalidLogin() {
  console.log('\n=== TC01: Testing Invalid Login Credentials ===');
  
  try {
    const response = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: INVALID_EMAIL,
        password: INVALID_PASSWORD
      })
    });

    if (response.status === 401 || response.status === 400) {
      logTest('TC01', 'Invalid login credentials', 'PASSED', 
        'System correctly rejected invalid credentials');
      return true;
    } else {
      logTest('TC01', 'Invalid login credentials', 'FAILED', 
        `Expected 401/400, got ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('TC01', 'Invalid login credentials', 'FAILED', error.message);
    return false;
  }
}

// TC02: Test valid admin login
async function testValidAdminLogin() {
  console.log('\n=== TC02: Testing Valid Admin Login ===');
  
  try {
    const response = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (response.ok && response.status === 200) {
      const data = await response.json();
      if (data.user && data.user.role === 'admin') {
        logTest('TC02', 'Valid admin login', 'PASSED', 
          'Admin successfully logged in and redirected');
        return true;
      } else {
        logTest('TC02', 'Valid admin login', 'FAILED', 
          'Login succeeded but role incorrect');
        return false;
      }
    } else {
      logTest('TC02', 'Valid admin login', 'FAILED', 
        `Expected 200, got ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('TC02', 'Valid admin login', 'FAILED', error.message);
    return false;
  }
}

// TC03: Test valid insurer login
async function testValidInsurerLogin() {
  console.log('\n=== TC03: Testing Valid Insurer Login ===');
  
  try {
    const response = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: INSURER_EMAIL,
        password: INSURER_PASSWORD
      })
    });

    if (response.ok && response.status === 200) {
      const data = await response.json();
      if (data.user && data.user.role === 'insurer') {
        logTest('TC03', 'Valid insurer login', 'PASSED', 
          'Insurer successfully logged in');
        return true;
      } else {
        logTest('TC03', 'Valid insurer login', 'FAILED', 
          'Login succeeded but role incorrect');
        return false;
      }
    } else {
      logTest('TC03', 'Valid insurer login', 'FAILED', 
        `Expected 200, got ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('TC03', 'Valid insurer login', 'FAILED', error.message);
    return false;
  }
}

// TC04: Test access restriction for insurer accessing admin routes
async function testInsurerAccessRestriction() {
  console.log('\n=== TC04: Testing Insurer Access Restriction ===');
  
  try {
    // First login as insurer
    const loginResponse = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: INSURER_EMAIL,
        password: INSURER_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      logTest('TC04', 'Insurer access restriction', 'FAILED', 
        'Could not login as insurer');
      return false;
    }

    // Try to access admin-only endpoint
    const adminResponse = await makeRequest(`${BASE_URL}/auth/users`, {
      method: 'GET'
    });

    if (adminResponse.status === 403 || adminResponse.status === 401) {
      logTest('TC04', 'Insurer access restriction', 'PASSED', 
        'Insurer correctly denied access to admin routes');
      return true;
    } else {
      logTest('TC04', 'Insurer access restriction', 'FAILED', 
        `Expected 403/401, got ${adminResponse.status}`);
      return false;
    }
  } catch (error) {
    logTest('TC04', 'Insurer access restriction', 'FAILED', error.message);
    return false;
  }
}

// TC05: Test secure logout
async function testSecureLogout() {
  console.log('\n=== TC05: Testing Secure Logout ===');
  
  try {
    // First login
    const loginResponse = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      logTest('TC05', 'Secure logout', 'FAILED', 'Could not login');
      return false;
    }

    // Logout
    const logoutResponse = await makeRequest(`${BASE_URL}/auth/logout`, {
      method: 'POST'
    });

    if (logoutResponse.ok) {
      // Try to access protected route after logout
      const profileResponse = await makeRequest(`${BASE_URL}/auth/profile`, {
        method: 'GET'
      });

      if (profileResponse.status === 401) {
        logTest('TC05', 'Secure logout', 'PASSED', 
          'User successfully logged out and session cleared');
        return true;
      } else {
        logTest('TC05', 'Secure logout', 'FAILED', 
          'Session not properly cleared after logout');
        return false;
      }
    } else {
      logTest('TC05', 'Secure logout', 'FAILED', 
        `Logout failed with status ${logoutResponse.status}`);
      return false;
    }
  } catch (error) {
    logTest('TC05', 'Secure logout', 'FAILED', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('========================================');
  console.log('Authentication Test Suite');
  console.log('Reinsurance Claims Management System');
  console.log('========================================\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 5
  };

  if (await testInvalidLogin()) results.passed++; else results.failed++;
  if (await testValidAdminLogin()) results.passed++; else results.failed++;
  if (await testValidInsurerLogin()) results.passed++; else results.failed++;
  if (await testInsurerAccessRestriction()) results.passed++; else results.failed++;
  if (await testSecureLogout()) results.passed++; else results.failed++;

  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  return results;
}

// Export for use in other scripts or run directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testResults };
} else {
  // Run tests if executed directly
  runAllTests().catch(console.error);
}

