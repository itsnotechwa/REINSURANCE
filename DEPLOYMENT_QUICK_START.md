# Quick Deployment Checklist

## 🚂 Railway (Backend) - 5 Steps

1. **Create Railway Project**
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Select your repository

2. **Configure Service**
   - Set Root Directory: `Backend`
   - Add PostgreSQL database (automatic `DATABASE_URL`)

3. **Set Environment Variables**
   ```
   SECRET_KEY=<generate-random-key>
   FLASK_ENV=production
   FRONTEND_URL=https://your-app.vercel.app (update after frontend deploy)
   ```

4. **Deploy**
   - Railway auto-deploys on push
   - Copy the generated URL (e.g., `https://xxx.railway.app`)

5. **Update CORS**
   - After frontend is deployed, update `FRONTEND_URL` in Railway

---

## ⚡ Vercel (Frontend) - 4 Steps

1. **Create Vercel Project**
   - Go to [vercel.com](https://vercel.com)
   - Add New Project → Import GitHub repo

2. **Configure Project**
   - Root Directory: `Frontend`
   - Framework: Vite
   - Build Command: `pnpm build`
   - Output Directory: `dist/public`

3. **Set Environment Variable**
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

4. **Deploy**
   - Click Deploy
   - Copy your Vercel URL

---

## 🔗 Connect Them

1. Update `FRONTEND_URL` in Railway with your Vercel URL
2. Update `VITE_API_URL` in Vercel with your Railway URL
3. Test: Visit Vercel URL and try to register/login

---

## ✅ Verify Deployment

- [ ] Backend accessible at Railway URL
- [ ] Frontend accessible at Vercel URL
- [ ] Can register new user
- [ ] Can login
- [ ] Can upload claim
- [ ] No CORS errors in browser console

---

**Full Guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

