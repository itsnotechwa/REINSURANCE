# Testing Suite for Reinsurance Claims Management System

This directory contains comprehensive test scripts for validating the functionality, performance, scalability, and robustness of the Reinsurance Claims Management System.

## Prerequisites

Before running the tests, ensure:

1. **Backend server is running**: 
   ```bash
   cd Backend
   python3.11 run.py
   ```
   Backend should be accessible at `http://127.0.0.1:5000`

2. **Test users exist in database**:
   - Admin user: `admin@test.com` / `admin123`
   - Insurer user: `insurer@test.com` / `insurer123`

   You can create these users using the registration endpoint or through the frontend interface.

3. **Node.js installed** (version 14 or higher)

## Test Scripts

### 1. Authentication Tests (`authentication_test.js`)

Tests user authentication, login, logout, and role-based access control.

**Run:**
```bash
node tests/authentication_test.js
```

**Tests:**
- TC01: Invalid login credentials
- TC02: Valid admin login
- TC03: Valid insurer login
- TC04: Insurer access restriction
- TC05: Secure logout

### 2. Performance Tests (`performance_test.js`)

Tests system response times and performance metrics for critical operations.

**Run:**
```bash
node tests/performance_test.js
```

**Tests:**
- TC07: Admin dashboard load performance
- TC08: Claim submission performance
- TC09: Login page response time
- TC10: Claims list retrieval performance

### 3. Scalability Tests (`scalability_test.js`)

Tests system behavior under concurrent user load.

**Run:**
```bash
node tests/scalability_test.js
```

**Tests:**
- TC05: Concurrent login requests (up to 100 users)
- TC06: Content accuracy under load
- Individual page scalability testing

### 4. Claim Processing Tests (`claim_processing_test.js`)

Tests claim upload, fraud detection, and reserve estimation functionality.

**Run:**
```bash
node tests/claim_processing_test.js
```

**Tests:**
- TC09: Claim upload and processing
- TC10: Fraud detection accuracy
- TC11: Reserve estimation
- TC12: Claims list retrieval

### 5. Robustness Tests (`robustness_test.js`)

Tests system stability, error handling, and availability.

**Run:**
```bash
node tests/robustness_test.js
```

**Tests:**
- TC15: Robustness and availability
- TC16: Broken routes handling
- TC17: Database availability

### 6. Run All Tests (`run_all_tests.js`)

Executes all test suites in sequence and provides a comprehensive summary.

**Run:**
```bash
node tests/run_all_tests.js
```

This will run all test suites and provide a final summary with pass/fail rates.

## Test Results

Test results are displayed in the console with:
- ✓ Passed tests
- ✗ Failed tests
- Response times
- Status codes
- Success rates

## Screenshots for Documentation

When running tests for Chapter 7 documentation, capture screenshots of:

1. **Console output** - Test execution results
2. **Frontend interfaces** - Login pages, dashboards, claim upload forms
3. **Code editors** - Test script implementations
4. **Database views** - If using database browser tools

## Troubleshooting

### Tests fail with connection errors
- Ensure backend server is running on port 5000
- Check that CORS is properly configured
- Verify network connectivity

### Authentication tests fail
- Ensure test users exist in the database
- Check that passwords match test credentials
- Verify session cookies are being set correctly

### Performance tests show high response times
- Check backend server performance
- Verify database is not locked or under heavy load
- Ensure no other processes are consuming system resources

### Scalability tests fail
- Increase timeout values if needed
- Reduce concurrent user count for testing
- Check server resource limits

## Notes

- Tests use mock PDF files for claim uploads (the system generates synthetic data)
- Some tests require valid user sessions (cookies)
- Performance thresholds may need adjustment based on hardware capabilities
- All tests are designed to be non-destructive (they don't delete production data)

## Integration with Chapter 7

These test scripts correspond to the test cases documented in Chapter 7: Testing & Evaluation. Each test case ID (TC01, TC02, etc.) matches the documentation for easy reference.

