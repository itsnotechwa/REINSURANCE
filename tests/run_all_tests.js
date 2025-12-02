/**
 * Master Test Runner
 * Executes all test suites for the Reinsurance Claims Management System
 */

const { runAllTests } = require('./authentication_test');
const { runPerformanceTests } = require('./performance_test');
const { runScalabilityTests } = require('./scalability_test');
const { runClaimProcessingTests } = require('./claim_processing_test');
const { runRobustnessTests } = require('./robustness_test');

async function runAllTestSuites() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Reinsurance Claims Management System - Test Suite       ║');
  console.log('║                    Complete Test Run                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const results = {
    authentication: null,
    performance: null,
    scalability: null,
    claimProcessing: null,
    robustness: null
  };

  try {
    console.log('\n[1/5] Running Authentication Tests...');
    results.authentication = await runAllTests();
  } catch (error) {
    console.error('Authentication tests failed:', error);
  }

  try {
    console.log('\n[2/5] Running Performance Tests...');
    results.performance = await runPerformanceTests();
  } catch (error) {
    console.error('Performance tests failed:', error);
  }

  try {
    console.log('\n[3/5] Running Scalability Tests...');
    results.scalability = await runScalabilityTests();
  } catch (error) {
    console.error('Scalability tests failed:', error);
  }

  try {
    console.log('\n[4/5] Running Claim Processing Tests...');
    results.claimProcessing = await runClaimProcessingTests();
  } catch (error) {
    console.error('Claim processing tests failed:', error);
  }

  try {
    console.log('\n[5/5] Running Robustness Tests...');
    results.robustness = await runRobustnessTests();
  } catch (error) {
    console.error('Robustness tests failed:', error);
  }

  // Final Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL TEST SUMMARY                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  Object.entries(results).forEach(([suite, result]) => {
    if (result) {
      totalTests += result.total;
      totalPassed += result.passed;
      totalFailed += result.failed;
      
      const status = result.failed === 0 ? '✓' : '✗';
      const passRate = ((result.passed / result.total) * 100).toFixed(1);
      console.log(`${status} ${suite.toUpperCase()}: ${result.passed}/${result.total} passed (${passRate}%)`);
    } else {
      console.log(`✗ ${suite.toUpperCase()}: Tests not executed`);
    }
  });

  console.log('\n────────────────────────────────────────────────────────────');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Overall Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  console.log('────────────────────────────────────────────────────────────\n');

  return results;
}

// Run if executed directly
if (require.main === module) {
  runAllTestSuites().catch(console.error);
}

module.exports = { runAllTestSuites };

