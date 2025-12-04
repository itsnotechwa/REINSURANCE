# Railway Port Configuration Fix

## Issue
Railway is asking for a port and you're getting 404 errors when accessing the root URL.

## Solution

### 1. Port Configuration in Railway

**DO NOT manually set a port in Railway settings!**

Railway automatically sets the `PORT` environment variable. Your `Procfile` and `railway.json` are already configured to use `$PORT`:

```bash
# Procfile
web: gunicorn run:app --bind 0.0.0.0:$PORT
```

**In Railway Dashboard:**
1. Go to your service → **Settings** → **Networking**
2. **Leave the port field blank** or set it to **auto**
3. Railway will automatically assign a port and set the `PORT` environment variable

### 2. Root Route Added

I've added a health check route at `/` and `/health` so Railway can verify your app is running:

- `GET /` - Returns API status
- `GET /health` - Health check endpoint

### 3. Testing Your Deployment

After Railway redeploys, test these endpoints:

1. **Health Check:**
   ```
   https://your-backend.railway.app/
   https://your-backend.railway.app/health
   ```
   Should return: `{"status": "healthy", "service": "Reinsurance Claims Management API", "version": "1.0.0"}`

2. **API Endpoints:**
   ```
   https://your-backend.railway.app/auth/profile
   https://your-backend.railway.app/claim/claims
   ```

### 4. Common Issues

**404 on Root URL:**
- ✅ **FIXED** - Added root route for health checks
- Your API routes are under prefixes (`/auth`, `/claim`, etc.)

**Port Configuration:**
- ✅ **CORRECT** - Procfile uses `$PORT` automatically
- ❌ **WRONG** - Don't manually set port to 8080 or any specific number
- Railway sets `PORT` automatically - just use `$PORT` in your start command

**App Not Starting:**
- Check Railway logs for errors
- Verify `gunicorn` is in `requirements.txt` (it is)
- Verify `Procfile` exists in `Backend/` directory (it does)

## Next Steps

1. **Commit and push the health check route:**
   ```bash
   git add Backend/app/__init__.py
   git commit -m "Add health check route for Railway deployment"
   git push origin main
   ```

2. **In Railway Dashboard:**
   - Go to Settings → Networking
   - Ensure port is set to **auto** or left blank
   - Railway will automatically redeploy

3. **Test the deployment:**
   - Visit `https://your-backend.railway.app/`
   - Should see: `{"status": "healthy", ...}`
   - Visit `https://your-backend.railway.app/health`
   - Should see the same response

## Summary

- ✅ Port: Leave blank/auto in Railway (uses `$PORT` automatically)
- ✅ Health check: Added `/` and `/health` routes
- ✅ Procfile: Correctly configured to use `$PORT`
- ✅ All API routes are under prefixes: `/auth/*`, `/claim/*`, `/ml/*`, `/convert/*`

Your app should now work correctly on Railway!

