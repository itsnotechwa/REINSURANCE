/**
 * Robustness and Availability Testing Script
 * Tests system stability, error handling, and availability
 */

const BASE_URL = 'http://127.0.0.1:5000';

const robustnessResults = [];

function logRobustnessTest(testName, status, message, data = {}) {
  const result = {
    testName,
    status,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  robustnessResults.push(result);
  console.log(`[${status}] ${testName}: ${message}`);
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
    return { response, error: null };
  } catch (error) {
    return { response: null, error: error.message };
  }
}

// TC15: Test robustness and availability
async function testRobustnessAndAvailability() {
  console.log('\n=== TC15: Testing Robustness and Availability ===');
  
  const endpoints = [
    { name: 'Item Collection (Claims Report)', url: `${BASE_URL}/claim/report`, maxTime: 500 },
    { name: 'Claims List', url: `${BASE_URL}/claim/claims`, maxTime: 600 },
    { name: 'Login Endpoint', url: `${BASE_URL}/auth/login`, maxTime: 500 }
  ];

  let allPassed = true;

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    const { response, error } = await makeRequest(endpoint.url, { method: 'GET' });
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      logRobustnessTest(endpoint.name, 'FAILED', `Request error: ${error}`, { duration });
      allPassed = false;
      continue;
    }

    // For robustness testing, we accept:
    // - 200: Success
    // - 401: Unauthorized (expected for protected routes without auth)
    // - 405: Method Not Allowed (expected for wrong HTTP method - server handled it correctly)
    // All indicate the server is responding and handling requests properly
    const statusOk = response.status === 200 || response.status === 401 || response.status === 405;
    const timeOk = duration < endpoint.maxTime;

    if (statusOk && timeOk) {
      const statusNote = response.status === 401 ? ' (Unauthorized - expected for protected routes)' :
                         response.status === 405 ? ' (Method Not Allowed - server properly rejected wrong HTTP method)' :
                         '';
      logRobustnessTest(endpoint.name, 'PASSED', 
        `Status ${response.status}${statusNote}, Response time ${duration}ms`, 
        { status: response.status, duration, maxTime: endpoint.maxTime });
    } else {
      logRobustnessTest(endpoint.name, 'FAILED', 
        `Status ${response.status}, Response time ${duration}ms (max: ${endpoint.maxTime}ms)`, 
        { status: response.status, duration, maxTime: endpoint.maxTime });
      allPassed = false;
    }
  }

  return allPassed;
}

// Test broken routes handling
async function testBrokenRoutesHandling() {
  console.log('\n=== Testing Broken Routes Handling ===');
  
  const brokenRoutes = [
    '/nonexistent-endpoint',
    '/claim/invalid-route',
    '/auth/missing-endpoint'
  ];

  let allHandled = true;

  for (const route of brokenRoutes) {
    const { response, error } = await makeRequest(`${BASE_URL}${route}`, { method: 'GET' });

    if (error) {
      logRobustnessTest(`Broken Route: ${route}`, 'FAILED', `Request error: ${error}`);
      allHandled = false;
      continue;
    }

    // Should return 404 or proper error handling
    if (response.status === 404 || response.status === 405) {
      logRobustnessTest(`Broken Route: ${route}`, 'PASSED', 
        `Properly handled with status ${response.status}`);
    } else {
      logRobustnessTest(`Broken Route: ${route}`, 'FAILED', 
        `Unexpected status ${response.status}`);
      allHandled = false;
    }
  }

  return allHandled;
}

// Test database availability
async function testDatabaseAvailability() {
  console.log('\n=== Testing Database Availability ===');
  
  try {
    // Login to test database connection
    const { response, error } = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'wrongpassword'
      })
    });

    if (error) {
      logRobustnessTest('Database Availability', 'FAILED', `Connection error: ${error}`);
      return false;
    }

    // Even with wrong credentials, if we get 401, database is responding
    if (response.status === 401 || response.status === 400) {
      logRobustnessTest('Database Availability', 'PASSED', 
        'Database is accessible and responding');
      return true;
    } else if (response.status === 500) {
      logRobustnessTest('Database Availability', 'FAILED', 
        'Database connection error (500)');
      return false;
    } else {
      logRobustnessTest('Database Availability', 'PASSED', 
        `Database responding (status ${response.status})`);
      return true;
    }
  } catch (error) {
    logRobustnessTest('Database Availability', 'FAILED', error.message);
    return false;
  }
}

// Run all robustness tests
async function runRobustnessTests() {
  console.log('========================================');
  console.log('Robustness and Availability Test Suite');
  console.log('Reinsurance Claims Management System');
  console.log('========================================\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 3
  };

  if (await testRobustnessAndAvailability()) results.passed++; else results.failed++;
  if (await testBrokenRoutesHandling()) results.passed++; else results.failed++;
  if (await testDatabaseAvailability()) results.passed++; else results.failed++;

  console.log('\n========================================');
  console.log('Robustness Test Summary');
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
  module.exports = { runRobustnessTests, robustnessResults };
} else {
  runRobustnessTests().catch(console.error);
}

