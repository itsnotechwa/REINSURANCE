# Deployment Guide: Vercel + Railway

This guide will walk you through deploying your Reinsurance Claims Management System to **Vercel** (frontend) and **Railway** (backend).

---

## 📋 Prerequisites

- GitHub account (for repository hosting)
- Vercel account (free tier available) - [Sign up](https://vercel.com)
- Railway account (free tier available) - [Sign up](https://railway.app)
- Git installed locally
- Your project code pushed to a GitHub repository

---

## 🚂 Part 1: Deploy Backend to Railway

### Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Verify these files exist in your `Backend/` directory**:
   - ✅ `Procfile` (created)
   - ✅ `railway.json` (created)
   - ✅ `requirements.txt` (updated with gunicorn and psycopg2-binary)
   - ✅ `runtime.txt` (created)

### Step 2: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your repository
6. Railway will automatically detect it's a Python project

### Step 3: Configure Backend Service

1. **Set Root Directory**:
   - Click on your service
   - Go to **Settings** → **Source**
   - Set **Root Directory** to: `Backend`

2. **Add PostgreSQL Database**:
   - Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway will automatically create a PostgreSQL database
   - The `DATABASE_URL` environment variable will be automatically set

3. **Configure Environment Variables**:
   - Go to **Variables** tab
   - Add the following environment variables:

   | Variable Name | Value | Description |
   |--------------|-------|-------------|
   | `SECRET_KEY` | `[Generate a secure random string]` | Flask secret key for sessions |
   | `FLASK_ENV` | `production` | Environment mode |
   | `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL (update after deploying frontend) |
   | `PORT` | `5000` | Port (Railway sets this automatically, but good to have) |

   **Generate SECRET_KEY**:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

4. **Configure Build Settings**:
   - Go to **Settings** → **Build**
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn run:app --bind 0.0.0.0:$PORT`

### Step 4: Deploy Backend

1. Railway will automatically start building and deploying
2. Wait for the build to complete (check the **Deployments** tab)
3. Once deployed, Railway will provide a public URL (e.g., `https://your-backend.railway.app`)
4. **Copy this URL** - you'll need it for the frontend configuration

### Step 5: Initialize Database

1. Go to your Railway service → **Deployments**
2. Click on the latest deployment → **View Logs**
3. The database tables should be created automatically (via `db.create_all()` in `__init__.py`)
4. If you need to run migrations manually, you can use Railway's **Shell** feature

### Step 6: Update CORS Settings

1. Go back to **Variables** in Railway
2. Update `FRONTEND_URL` with your Vercel URL (you'll get this in Part 2)
3. Railway will automatically redeploy with the new settings

---

## ⚡ Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend Configuration

1. **Verify `vercel.json` exists** in your `Frontend/` directory (created)

2. **Create `.env.production` file** (optional, you can also set in Vercel dashboard):
   ```env
   VITE_API_URL=https://your-backend.railway.app
   ```

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. **Configure Project Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `Frontend`
   - **Build Command**: `pnpm build` (or `npm run build`)
   - **Output Directory**: `dist/public`
   - **Install Command**: `pnpm install` (or `npm install`)

5. **Environment Variables**:
   - Click **"Environment Variables"**
   - Add the following:

   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `VITE_API_URL` | `https://your-backend.railway.app` | Production, Preview, Development |

   **Important**: Replace `your-backend.railway.app` with your actual Railway backend URL from Part 1, Step 4.

6. Click **"Deploy"**

### Step 3: Configure Vercel Build Settings

If the automatic detection doesn't work, manually configure:

1. Go to **Settings** → **General**
2. Set:
   - **Framework Preset**: Vite
   - **Root Directory**: `Frontend`
   - **Build Command**: `pnpm install && pnpm build`
   - **Output Directory**: `dist/public`

### Step 4: Update Railway Backend CORS

1. Go back to Railway dashboard
2. Update the `FRONTEND_URL` environment variable with your Vercel URL
3. Railway will automatically redeploy

---

## 🔄 Part 3: Connect Frontend and Backend

### Step 1: Update Environment Variables

**In Vercel:**
- Ensure `VITE_API_URL` points to your Railway backend URL

**In Railway:**
- Ensure `FRONTEND_URL` points to your Vercel frontend URL

### Step 2: Test the Connection

1. Visit your Vercel frontend URL
2. Try to register a new account
3. Check browser console for any CORS errors
4. If you see CORS errors, verify:
   - Railway `FRONTEND_URL` matches your Vercel URL exactly
   - Railway backend is using the updated CORS configuration

---

## 🔧 Troubleshooting

### Backend Issues

**Problem: Database connection fails**
- ✅ Verify `DATABASE_URL` is set in Railway variables
- ✅ Check that PostgreSQL service is running in Railway
- ✅ Ensure `psycopg2-binary` is in `requirements.txt`

**Problem: Build fails**
- ✅ Check Railway build logs
- ✅ Verify `requirements.txt` has all dependencies
- ✅ Ensure Python version in `runtime.txt` is correct

**Problem: CORS errors**
- ✅ Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
- ✅ Check that `supports_credentials=True` in CORS config
- ✅ Ensure cookies are being sent (check browser DevTools → Network)

### Frontend Issues

**Problem: API calls fail**
- ✅ Verify `VITE_API_URL` is set correctly in Vercel
- ✅ Check that the Railway backend URL is accessible
- ✅ Ensure environment variable is set for the correct environment (Production/Preview)

**Problem: Build fails**
- ✅ Check Vercel build logs
- ✅ Verify `package.json` has correct build script
- ✅ Ensure `vercel.json` configuration is correct

**Problem: 404 errors on routes**
- ✅ Verify `vercel.json` has the rewrite rule for SPA routing
- ✅ Check that `outputDirectory` points to the correct build output

---

## 📝 Environment Variables Summary

### Railway (Backend)

```env
DATABASE_URL=postgresql://... (automatically set by Railway)
SECRET_KEY=your-secret-key-here
FLASK_ENV=production
FRONTEND_URL=https://your-app.vercel.app
PORT=5000
```

### Vercel (Frontend)

```env
VITE_API_URL=https://your-backend.railway.app
```

---

## 🚀 Post-Deployment Checklist

- [ ] Backend deployed successfully on Railway
- [ ] Frontend deployed successfully on Vercel
- [ ] Database tables created (check Railway logs)
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] Can register a new user
- [ ] Can login with created user
- [ ] Can upload a claim
- [ ] Can view dashboard
- [ ] Cookies are being sent (check DevTools)

---

## 🔐 Security Considerations

1. **SECRET_KEY**: Use a strong, random secret key in production
2. **HTTPS**: Both Vercel and Railway provide HTTPS by default
3. **CORS**: Only allow your frontend domain
4. **Cookies**: Ensure `SESSION_COOKIE_SECURE=True` in production (handled automatically)
5. **Environment Variables**: Never commit secrets to Git

---

## 📊 Monitoring

### Railway
- View logs: Railway Dashboard → Your Service → **Deployments** → **View Logs**
- Monitor metrics: Railway Dashboard → Your Service → **Metrics**

### Vercel
- View logs: Vercel Dashboard → Your Project → **Deployments** → Click deployment → **Functions** tab
- Monitor analytics: Vercel Dashboard → Your Project → **Analytics**

---

## 🎉 You're Done!

Your application should now be live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.railway.app`

Both services will automatically redeploy when you push changes to your GitHub repository!

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Flask Deployment Guide](https://flask.palletsprojects.com/en/latest/deploying/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

---

## 🔄 Updating Your Deployment

### To update backend:
1. Make changes to your code
2. Commit and push to GitHub
3. Railway will automatically redeploy

### To update frontend:
1. Make changes to your code
2. Commit and push to GitHub
3. Vercel will automatically redeploy

### To update environment variables:
- **Railway**: Dashboard → Your Service → **Variables** → Edit
- **Vercel**: Dashboard → Your Project → **Settings** → **Environment Variables** → Edit

---

**Need Help?** Check the troubleshooting section or refer to the official documentation for Railway and Vercel.

