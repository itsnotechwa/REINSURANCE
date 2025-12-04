# CORS 405 Error Fix

## Issue
Getting 405 (Method Not Allowed) error when trying to login from Vercel frontend to Railway backend.

## Root Cause
The CORS configuration wasn't properly allowing the Vercel frontend URL, causing the OPTIONS preflight request to fail.

## Solution Applied

### Updated CORS Configuration
1. **Added support for all HTTP methods** including OPTIONS (required for preflight)
2. **Improved Vercel URL detection** - handles both production and preview URLs
3. **Added explicit headers** - allows Content-Type and Authorization headers
4. **Better origin matching** - supports Vercel's dynamic preview URLs

### Environment Variables Required

**In Railway (Backend):**
```
FRONTEND_URL=https://your-app.vercel.app
```

**Important:** Replace `your-app.vercel.app` with your actual Vercel deployment URL.

## Steps to Fix

### 1. Get Your Vercel URL
- Go to Vercel Dashboard → Your Project
- Copy the deployment URL (e.g., `https://reinsurance-abc123.vercel.app`)

### 2. Update Railway Environment Variable
1. Go to Railway Dashboard → Your Service
2. Click on **Variables** tab
3. Find or add `FRONTEND_URL`
4. Set value to your Vercel URL: `https://your-actual-vercel-url.vercel.app`
5. Railway will automatically redeploy

### 3. Verify CORS is Working
After Railway redeploys, test in browser console:
```javascript
fetch('https://your-backend.railway.app/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'test@test.com', password: 'test' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

## Testing

1. **Check Network Tab:**
   - Open browser DevTools → Network
   - Try to login
   - Look for the OPTIONS request (preflight)
   - Should return 200 OK, not 405

2. **Check Response Headers:**
   - OPTIONS request should have:
     - `Access-Control-Allow-Origin: https://your-vercel-url.vercel.app`
     - `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
     - `Access-Control-Allow-Credentials: true`

3. **Test Login:**
   - Should work without CORS errors
   - Session cookie should be set

## Common Issues

**Still getting 405:**
- Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Check that Railway has redeployed after the change
- Clear browser cache and cookies

**CORS errors in console:**
- Verify the Vercel URL in Railway environment variables
- Check that the URL includes `https://` protocol
- Ensure no trailing slashes

**Session not persisting:**
- Verify `SESSION_COOKIE_SECURE=True` in production (handled automatically)
- Check that cookies are being sent (DevTools → Application → Cookies)

## Summary

✅ CORS configuration updated to handle Vercel URLs
✅ OPTIONS method explicitly allowed for preflight
✅ All necessary headers configured
✅ Environment variable setup documented

**Next Step:** Update `FRONTEND_URL` in Railway with your actual Vercel URL and redeploy.

