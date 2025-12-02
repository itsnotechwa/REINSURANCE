/**
 * Claim Processing and Fraud Detection Testing Script
 * Tests claim upload, fraud detection, and reserve estimation
 */

const BASE_URL = 'http://127.0.0.1:5000';

const testResults = [];

function logTest(testId, scenario, status, message, data = {}) {
  const result = {
    testId,
    scenario,
    status,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  console.log(`[${status}] ${testId}: ${scenario} - ${message}`);
}

async function loginAsInsurer() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: 'insurer@test.com',
      password: 'insurer123'
    })
  });
  return response.ok;
}

// TC09: Test claim upload and processing
async function testClaimUpload() {
  console.log('\n=== TC09: Testing Claim Upload and Processing ===');
  
  try {
    // Login first
    const loggedIn = await loginAsInsurer();
    if (!loggedIn) {
      logTest('TC09', 'Claim upload', 'FAILED', 'Could not login');
      return false;
    }

    // Create mock PDF file
    const formData = new FormData();
    const blob = new Blob(['Mock PDF content for claim testing'], { type: 'application/pdf' });
    formData.append('file', blob, 'test-claim.pdf');

    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/claim/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response.ok) {
      const data = await response.json();
      
      // Verify response structure
      const hasClaim = data.claim && data.claim.id;
      const hasPrediction = data.prediction && data.prediction.fraud_score !== undefined;
      
      if (hasClaim && hasPrediction) {
        logTest('TC09', 'Claim upload', 'PASSED', 
          `Claim processed in ${duration}ms`, {
            claimId: data.claim.id,
            fraudScore: data.prediction.fraud_score,
            reserveEstimate: data.prediction.reserve_estimate
          });
        return true;
      } else {
        logTest('TC09', 'Claim upload', 'FAILED', 
          'Response missing required fields');
        return false;
      }
    } else {
      const error = await response.json();
      logTest('TC09', 'Claim upload', 'FAILED', 
        `Upload failed: ${error.message || response.status}`);
      return false;
    }
  } catch (error) {
    logTest('TC09', 'Claim upload', 'FAILED', error.message);
    return false;
  }
}

// TC10: Test fraud detection accuracy
async function testFraudDetection() {
  console.log('\n=== TC10: Testing Fraud Detection Accuracy ===');
  
  try {
    const loggedIn = await loginAsInsurer();
    if (!loggedIn) {
      logTest('TC10', 'Fraud detection', 'FAILED', 'Could not login');
      return false;
    }

    // Upload a claim
    const formData = new FormData();
    const blob = new Blob(['High value claim test'], { type: 'application/pdf' });
    formData.append('file', blob, 'high-value-claim.pdf');

    const response = await fetch(`${BASE_URL}/claim/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      const prediction = data.prediction;

      // Verify fraud detection fields
      const hasFraudScore = typeof prediction.fraud_score === 'number' && 
                           prediction.fraud_score >= 0 && 
                           prediction.fraud_score <= 1;
      const hasFraudFlag = typeof prediction.is_fraudulent === 'boolean';
      const hasReserve = typeof prediction.reserve_estimate === 'number' && 
                        prediction.reserve_estimate > 0;

      if (hasFraudScore && hasFraudFlag && hasReserve) {
        logTest('TC10', 'Fraud detection', 'PASSED', 
          'Fraud detection working correctly', {
            fraudScore: prediction.fraud_score,
            isFraudulent: prediction.is_fraudulent,
            reserveEstimate: prediction.reserve_estimate,
            modelVersion: prediction.model_version
          });
        return true;
      } else {
        logTest('TC10', 'Fraud detection', 'FAILED', 
          'Fraud detection response incomplete');
        return false;
      }
    } else {
      logTest('TC10', 'Fraud detection', 'FAILED', 
        'Could not upload claim for testing');
      return false;
    }
  } catch (error) {
    logTest('TC10', 'Fraud detection', 'FAILED', error.message);
    return false;
  }
}

// TC11: Test reserve estimation
async function testReserveEstimation() {
  console.log('\n=== TC11: Testing Reserve Estimation ===');
  
  try {
    const loggedIn = await loginAsInsurer();
    if (!loggedIn) {
      logTest('TC11', 'Reserve estimation', 'FAILED', 'Could not login');
      return false;
    }

    // Upload a claim
    const formData = new FormData();
    const blob = new Blob(['Reserve estimation test'], { type: 'application/pdf' });
    formData.append('file', blob, 'reserve-test.pdf');

    const response = await fetch(`${BASE_URL}/claim/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      const reserve = data.prediction.reserve_estimate;

      // Verify reserve is a positive number
      if (typeof reserve === 'number' && reserve > 0) {
        logTest('TC11', 'Reserve estimation', 'PASSED', 
          `Reserve estimated: $${reserve.toLocaleString()}`, {
            reserveEstimate: reserve,
            claimAmount: data.claim.extracted_data?.claim_amount || 'N/A'
          });
        return true;
      } else {
        logTest('TC11', 'Reserve estimation', 'FAILED', 
          'Invalid reserve estimate');
        return false;
      }
    } else {
      logTest('TC11', 'Reserve estimation', 'FAILED', 
        'Could not upload claim for testing');
      return false;
    }
  } catch (error) {
    logTest('TC11', 'Reserve estimation', 'FAILED', error.message);
    return false;
  }
}

// TC12: Test claims list retrieval
async function testClaimsListRetrieval() {
  console.log('\n=== TC12: Testing Claims List Retrieval ===');
  
  try {
    const loggedIn = await loginAsInsurer();
    if (!loggedIn) {
      logTest('TC12', 'Claims list', 'FAILED', 'Could not login');
      return false;
    }

    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/claim/claims?page=1&limit=10`, {
      method: 'GET',
      credentials: 'include'
    });
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response.ok) {
      const data = await response.json();
      
      // Verify response structure
      const hasClaims = Array.isArray(data.claims);
      const hasTotal = typeof data.total === 'number';

      if (hasClaims && hasTotal) {
        logTest('TC12', 'Claims list', 'PASSED', 
          `Retrieved ${data.claims.length} claims in ${duration}ms`, {
            totalClaims: data.total,
            returnedClaims: data.claims.length,
            responseTime: duration
          });
        return true;
      } else {
        logTest('TC12', 'Claims list', 'FAILED', 
          'Response structure invalid');
        return false;
      }
    } else {
      logTest('TC12', 'Claims list', 'FAILED', 
        `Request failed with status ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('TC12', 'Claims list', 'FAILED', error.message);
    return false;
  }
}

// Run all claim processing tests
async function runClaimProcessingTests() {
  console.log('========================================');
  console.log('Claim Processing Test Suite');
  console.log('Reinsurance Claims Management System');
  console.log('========================================\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 4
  };

  if (await testClaimUpload()) results.passed++; else results.failed++;
  if (await testFraudDetection()) results.passed++; else results.failed++;
  if (await testReserveEstimation()) results.passed++; else results.failed++;
  if (await testClaimsListRetrieval()) results.passed++; else results.failed++;

  console.log('\n========================================');
  console.log('Claim Processing Test Summary');
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
  module.exports = { runClaimProcessingTests, testResults };
} else {
  runClaimProcessingTests().catch(console.error);
}

