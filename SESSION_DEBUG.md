# Session Cookie Debugging Guide

## Current Issue
401 Unauthorized error persists after login, indicating session cookies aren't being sent/read properly.

## Changes Made

1. **Added `SESSION_COOKIE_PATH = '/'`** - Ensures cookies are available for all paths
2. **Added `SESSION_COOKIE_DOMAIN = None`** - Lets browser handle domain for cross-origin
3. **Added `session.modified = True`** - Explicitly marks session as modified to ensure it's saved
4. **Added debug logging** - Logs session contents to help diagnose issues

## How to Debug

### 1. Check Browser DevTools

**After logging in:**
1. Open DevTools → **Application** → **Cookies**
2. Look for cookies from your Railway domain
3. Check:
   - Is there a `session` cookie?
   - Does it have `Secure` flag? (should be Yes)
   - Does it have `SameSite=None`? (should be Yes)
   - What's the domain? (should be your Railway domain)

**In Network Tab:**
1. Try to access a protected endpoint
2. Check the request headers:
   - Is there a `Cookie:` header?
   - Does it include the session cookie?

### 2. Check Railway Logs

After the fix is deployed, check Railway logs for:
- Session debug messages showing session contents
- Any errors about session storage

### 3. Test in Browser Console

On your Vercel site, open console and run:
```javascript
// Check if cookies are being sent
fetch('https://reinsurance-production.up.railway.app/auth/profile', {
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### 4. Verify Environment Variables

In Railway, ensure:
- `FLASK_ENV=production` ✅
- `FRONTEND_URL=https://your-vercel-app.vercel.app` ✅
- `SECRET_KEY` is set ✅

## Common Issues

### Cookies Not Being Set
- Check CORS configuration
- Verify `FRONTEND_URL` matches your Vercel URL exactly
- Check that both sites use HTTPS

### Cookies Not Being Sent
- Verify `credentials: 'include'` in frontend fetch calls
- Check browser console for CORS errors
- Verify cookie domain/path settings

### Session Not Persisting
- Check `SECRET_KEY` is set and consistent
- Verify session storage backend (Flask uses signed cookies by default)
- Check if multiple Gunicorn workers are causing session issues

## Next Steps

1. **Deploy the fix** - Commit and push the changes
2. **Clear browser cookies** - Delete all cookies for both Vercel and Railway domains
3. **Test login again** - Register/login and check if session persists
4. **Check logs** - Review Railway logs for debug messages
5. **Verify cookies** - Use DevTools to confirm cookies are set and sent

## If Still Not Working

If the issue persists after these changes, we may need to:
- Switch to server-side session storage (Redis)
- Use JWT tokens instead of session cookies
- Add more detailed logging to trace the session flow

