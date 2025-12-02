# RBAC Testing Guide

## Prerequisites

Before testing, ensure:
1. Backend server is running (`python run.py` or similar)
2. Frontend dev server is running (`npm run dev`)
3. Database is initialized with tables
4. At least one admin and one insurer user exist

---

## Creating Test Users

### Create Admin User

```bash
# Using the register endpoint
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }'
```

### Create Insurer User

```bash
# Using the register endpoint
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "insurer@test.com",
    "password": "insurer123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "insurer"
  }'
```

### Create Second Insurer (for testing isolation)

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "insurer2@test.com",
    "password": "insurer123",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "insurer"
  }'
```

---

## Test Suite

### Test 1: Insurer Login and Navigation

**Objective**: Verify insurer sees correct navigation menu

**Steps**:
1. Open browser to `http://localhost:5173/login`
2. Login with insurer credentials:
   - Email: `insurer@test.com`
   - Password: `insurer123`
3. Verify navigation menu shows:
   - ✅ Dashboard
   - ✅ Upload Claim
   - ✅ Claims
   - ✅ Fraud Analytics
4. Verify navigation menu does NOT show:
   - ❌ All Claims
   - ❌ User Management
   - ❌ System Analytics
5. Verify user profile shows:
   - Name: "John Doe"
   - Role: "insurer"
   - ❌ No "Admin" badge

**Expected Result**: ✅ Pass - Insurer sees only 4 menu items, no admin badge

---

### Test 2: Admin Login and Navigation

**Objective**: Verify admin sees all navigation items including admin menu

**Steps**:
1. Logout if logged in
2. Login with admin credentials:
   - Email: `admin@test.com`
   - Password: `admin123`
3. Verify navigation menu shows:
   - ✅ Dashboard
   - ✅ Upload Claim
   - ✅ Claims
   - ✅ Fraud Analytics
   - ✅ All Claims
   - ✅ User Management
   - ✅ System Analytics
4. Verify user profile shows:
   - Name: "Admin User"
   - Role: "admin"
   - ✅ "Admin" badge visible

**Expected Result**: ✅ Pass - Admin sees all 7 menu items and admin badge

---

### Test 3: Insurer Data Isolation

**Objective**: Verify insurers only see their own claims

**Steps**:
1. Login as `insurer@test.com`
2. Upload a claim (save the claim ID, e.g., #1)
3. Logout
4. Login as `insurer2@test.com`
5. Upload a different claim (save the claim ID, e.g., #2)
6. Navigate to Claims page
7. Verify only claim #2 is visible
8. Attempt to access claim #1 directly:
   - Navigate to `/claims/1`
9. Verify 403 Forbidden or redirect

**Expected Result**: ✅ Pass - Each insurer sees only their own claims

---

### Test 4: Admin Can View All Claims

**Objective**: Verify admin can see claims from all users

**Steps**:
1. Ensure claims exist from multiple insurers (from Test 3)
2. Login as `admin@test.com`
3. Navigate to Claims page
4. Verify ALL claims are visible (both #1 and #2)
5. Click on claim #1 (created by insurer@test.com)
6. Verify claim details are accessible
7. Click on claim #2 (created by insurer2@test.com)
8. Verify claim details are accessible

**Expected Result**: ✅ Pass - Admin sees all claims from all users

---

### Test 5: Insurer Cannot Access Admin Pages

**Objective**: Verify insurers are blocked from admin routes

**Steps**:
1. Login as `insurer@test.com`
2. Attempt to navigate to `/admin/dashboard`
3. Verify redirected to `/dashboard`
4. Attempt to navigate to `/admin/users`
5. Verify redirected to `/dashboard`
6. Attempt to navigate to `/admin/analytics`
7. Verify redirected to `/dashboard`

**Expected Result**: ✅ Pass - All admin routes redirect to dashboard

---

### Test 6: Admin Can Access Admin Pages

**Objective**: Verify admin can access all admin pages

**Steps**:
1. Login as `admin@test.com`
2. Navigate to `/admin/dashboard`
3. Verify Admin Dashboard loads with system-wide stats
4. Navigate to `/admin/users`
5. Verify User Management page loads with all users
6. Verify table shows all 3 users (admin + 2 insurers)
7. Navigate to `/admin/analytics`
8. Verify System Analytics page loads with charts

**Expected Result**: ✅ Pass - All admin pages load successfully

---

### Test 7: Backend API Authorization

**Objective**: Verify backend properly enforces role-based access

**Test 7a: Insurer Cannot Access Users Endpoint**

```bash
# Login as insurer first to get session cookie
curl -c cookies.txt -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "insurer@test.com", "password": "insurer123"}'

# Attempt to access users endpoint
curl -b cookies.txt http://localhost:5000/auth/users
```

**Expected Result**: ✅ 403 Forbidden with message "Admin access required"

**Test 7b: Admin Can Access Users Endpoint**

```bash
# Login as admin first to get session cookie
curl -c admin_cookies.txt -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "admin123"}'

# Access users endpoint
curl -b admin_cookies.txt http://localhost:5000/auth/users
```

**Expected Result**: ✅ 200 OK with JSON array of all users

---

### Test 8: Claims Report Filtering

**Objective**: Verify reports show correct data based on role

**Test 8a: Insurer Report**

```bash
# Login as insurer
curl -c insurer_cookies.txt -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "insurer@test.com", "password": "insurer123"}'

# Get claims report
curl -b insurer_cookies.txt http://localhost:5000/claim/report
```

**Expected Result**: ✅ Report shows only insurer's own claims statistics

**Test 8b: Admin Report**

```bash
# Login as admin
curl -c admin_cookies.txt -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "admin123"}'

# Get claims report
curl -b admin_cookies.txt http://localhost:5000/claim/report
```

**Expected Result**: ✅ Report shows system-wide statistics (all users)

---

### Test 9: Claim Ownership Checks

**Objective**: Verify claim access is restricted to owner or admin

**Setup**: Create a claim as insurer@test.com (claim ID #1)

**Test 9a: Owner Can Access**

```bash
# Login as insurer (owner)
curl -c owner_cookies.txt -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "insurer@test.com", "password": "insurer123"}'

# Access own claim
curl -b owner_cookies.txt http://localhost:5000/claim/claims/1
```

**Expected Result**: ✅ 200 OK with claim details

**Test 9b: Other Insurer Cannot Access**

```bash
# Login as different insurer
curl -c other_cookies.txt -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "insurer2@test.com", "password": "insurer123"}'

# Attempt to access other's claim
curl -b other_cookies.txt http://localhost:5000/claim/claims/1
```

**Expected Result**: ✅ 403 Forbidden with message "Unauthorized access to claim"

**Test 9c: Admin Can Access Any Claim**

```bash
# Login as admin
curl -c admin_cookies.txt -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "admin123"}'

# Access any claim
curl -b admin_cookies.txt http://localhost:5000/claim/claims/1
```

**Expected Result**: ✅ 200 OK with claim details

---

### Test 10: UI Visual Elements

**Objective**: Verify UI elements display correctly based on role

**Test 10a: Admin Badge**
1. Login as admin
2. Check sidebar user section
3. ✅ Verify "Admin" badge appears next to name
4. Logout and login as insurer
5. ❌ Verify no badge appears

**Test 10b: Dashboard Stats**
1. Login as insurer with 2 claims
2. Note "Total Claims" number (should be 2)
3. Logout and login as admin
4. Note "Total Claims (System)" number (should be > 2)
5. ✅ Verify admin sees more claims than individual insurer

**Test 10c: Admin Dashboard Cards**
1. Login as admin
2. Navigate to `/admin/dashboard`
3. Verify 4 stat cards:
   - ✅ Total Claims (System)
   - ✅ Fraudulent Claims
   - ✅ Total Users
   - ✅ Avg Reserve
4. Verify "Total Users" matches actual user count

---

### Test 11: Role Badge Styling

**Objective**: Verify role badges have correct styling

**Steps**:
1. Login as admin
2. Navigate to `/admin/users`
3. Verify User Management table loads
4. Check role badges:
   - ✅ Admin users have default variant (blue/purple)
   - ✅ Insurer users have secondary variant (gray)
   - ✅ All badges show capitalized role name

**Expected Result**: ✅ Pass - Badges display with correct colors and text

---

### Test 12: Charts and Visualizations

**Objective**: Verify admin analytics pages render charts correctly

**Steps**:
1. Login as admin
2. Navigate to `/admin/dashboard`
3. Verify charts render:
   - ✅ Claims by Status (Pie Chart)
   - ✅ Fraud Detection Overview (Bar Chart)
   - ✅ User Distribution by Role (Pie Chart)
4. Navigate to `/admin/analytics`
5. Verify advanced charts render:
   - ✅ Fraud Score Distribution (Bar Chart)
   - ✅ Reserve vs Fraud Score (Bar Chart)
   - ✅ Top Fraud Indicators (Horizontal Bar)
   - ✅ Scatter Plot (Reserve vs Fraud Score)

**Expected Result**: ✅ Pass - All charts render without errors

---

### Test 13: Loading States

**Objective**: Verify loading states work correctly

**Steps**:
1. Login as admin
2. Navigate to `/admin/users`
3. Watch for loading spinner before data loads
4. ✅ Verify spinner appears
5. ✅ Verify spinner disappears when data loads
6. Repeat for `/admin/dashboard` and `/admin/analytics`

**Expected Result**: ✅ Pass - Loading spinners appear and disappear appropriately

---

### Test 14: Navigation Active States

**Objective**: Verify active navigation item is highlighted

**Steps**:
1. Login as admin
2. Navigate to Dashboard
3. ✅ Verify "Dashboard" menu item is highlighted
4. Navigate to User Management
5. ✅ Verify "User Management" menu item is highlighted
6. Navigate to System Analytics
7. ✅ Verify "System Analytics" menu item is highlighted

**Expected Result**: ✅ Pass - Active menu items are visually distinct

---

### Test 15: Session Persistence

**Objective**: Verify role persists across page refreshes

**Steps**:
1. Login as admin
2. Verify admin navigation visible
3. Refresh page (F5)
4. ✅ Verify still logged in as admin
5. ✅ Verify admin navigation still visible
6. ✅ Verify "Admin" badge still visible

**Expected Result**: ✅ Pass - Session persists, role maintained

---

## Automated Test Script

Here's a simple test script you can run:

```bash
#!/bin/bash

echo "🧪 RBAC Test Suite"
echo "=================="

BASE_URL="http://localhost:5000"

# Test 1: Register users
echo "📝 Test 1: Creating test users..."
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test_admin@test.com","password":"admin123","first_name":"Test","last_name":"Admin","role":"admin"}' > /dev/null
echo "✅ Admin user created"

curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test_insurer@test.com","password":"insurer123","first_name":"Test","last_name":"Insurer","role":"insurer"}' > /dev/null
echo "✅ Insurer user created"

# Test 2: Login as insurer
echo ""
echo "🔐 Test 2: Insurer login..."
curl -s -c insurer.txt -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test_insurer@test.com","password":"insurer123"}' > /dev/null
echo "✅ Insurer logged in"

# Test 3: Insurer tries to access users endpoint
echo ""
echo "🚫 Test 3: Insurer accessing admin endpoint..."
RESPONSE=$(curl -s -b insurer.txt $BASE_URL/auth/users)
if echo $RESPONSE | grep -q "Admin access required"; then
  echo "✅ Correctly blocked with 403"
else
  echo "❌ FAILED: Insurer should not access users endpoint"
fi

# Test 4: Login as admin
echo ""
echo "🔐 Test 4: Admin login..."
curl -s -c admin.txt -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test_admin@test.com","password":"admin123"}' > /dev/null
echo "✅ Admin logged in"

# Test 5: Admin accesses users endpoint
echo ""
echo "✅ Test 5: Admin accessing users endpoint..."
RESPONSE=$(curl -s -b admin.txt $BASE_URL/auth/users)
if echo $RESPONSE | grep -q "users"; then
  echo "✅ Admin can access users endpoint"
else
  echo "❌ FAILED: Admin should access users endpoint"
fi

# Cleanup
rm -f insurer.txt admin.txt

echo ""
echo "🎉 Test suite completed!"
```

Save as `test_rbac.sh` and run with `bash test_rbac.sh`

---

## Manual Testing Checklist

Print this checklist and check off each item:

### Backend Tests
- [ ] Admin can access `/auth/users`
- [ ] Insurer gets 403 on `/auth/users`
- [ ] Admin can view all claims
- [ ] Insurer can only view own claims
- [ ] Admin can access any claim by ID
- [ ] Insurer cannot access other's claims
- [ ] Claims report filters by role
- [ ] Prediction endpoint checks ownership

### Frontend Tests
- [ ] Insurer sees 4 navigation items
- [ ] Admin sees 7 navigation items
- [ ] Admin badge displays for admin
- [ ] No badge for insurer
- [ ] AdminRoute redirects non-admins
- [ ] Admin can access all admin pages
- [ ] Dashboard shows role-filtered data
- [ ] User Management table displays all users
- [ ] System Analytics charts render
- [ ] Loading states work correctly

### Security Tests
- [ ] Cannot bypass AdminRoute with URL manipulation
- [ ] Session persists across refreshes
- [ ] Logout clears session properly
- [ ] Role cannot be changed client-side
- [ ] API validates role on every request

---

## Expected Test Results Summary

| Test | Insurer | Admin | Expected Behavior |
|------|---------|-------|-------------------|
| View own claims | ✅ | ✅ | Both can view their own |
| View all claims | ❌ | ✅ | Only admin sees all |
| Access admin pages | ❌ | ✅ | Insurer redirected |
| Access `/auth/users` | ❌ | ✅ | 403 for insurer |
| See admin badge | ❌ | ✅ | Only admin has badge |
| See admin menu | ❌ | ✅ | Only admin sees menu |
| Upload claims | ✅ | ✅ | Both can upload |
| Delete own claims | ✅ | ✅ | Both can delete own |
| Delete any claim | ❌ | ✅ | Only admin can delete any |

---

## Troubleshooting Common Issues

### Issue: All tests fail with 401
**Solution**: Check that backend server is running and accepting requests

### Issue: Admin redirected from admin pages
**Solution**: Verify user role in database is 'admin', not 'Admin' (case-sensitive)

### Issue: Charts not rendering
**Solution**: Check browser console for errors, ensure recharts is installed

### Issue: Session not persisting
**Solution**: Check CORS settings, ensure credentials: 'include' in API calls

### Issue: 403 errors for admin
**Solution**: Check session cookie is being sent, verify require_admin() is working

---

## Performance Testing

### Load Test: Admin Dashboard
```bash
# Install Apache Bench if needed
# apt-get install apache2-utils

# Login first to get cookie
curl -c admin.txt -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'

# Load test the claims endpoint
ab -n 100 -c 10 -C "$(cat admin.txt | grep session | awk '{print $7}')" \
  http://localhost:5000/claim/claims
```

**Expected**: Should handle 100 requests with <1s average response time

---

## Security Audit Checklist

- [ ] All admin endpoints require `require_admin()`
- [ ] All claim endpoints check ownership or admin
- [ ] Frontend AdminRoute protects admin pages
- [ ] Session cookies are httpOnly
- [ ] Role stored server-side, not client-side
- [ ] No role information in JWT (using sessions)
- [ ] API validates authentication on every request
- [ ] Proper HTTP status codes (401, 403, 404)
- [ ] No sensitive data in error messages
- [ ] CORS configured correctly

---

## Conclusion

This comprehensive test suite covers:
- ✅ 15 detailed test scenarios
- ✅ Backend API authorization
- ✅ Frontend route protection
- ✅ UI visual elements
- ✅ Data isolation
- ✅ Role-based filtering
- ✅ Security validation

Run all tests to ensure RBAC is working correctly before deploying to production!

🎯 **Happy Testing!**


