# Deployment Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER BROWSER                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐              ┌──────────────────┐
│   VERCEL      │              │     RAILWAY       │
│  (Frontend)   │              │    (Backend)     │
│               │              │                   │
│  React + TS   │◄────────────►│   Flask + Python │
│  Vite Build   │   API Calls  │   Gunicorn       │
│               │   (HTTPS)    │                   │
│  Static Files │              │   REST API        │
└───────────────┘              └─────────┬─────────┘
                                         │
                                         │
                                         ▼
                                ┌──────────────────┐
                                │   PostgreSQL     │
                                │   (Railway DB)   │
                                │                  │
                                │  - Users         │
                                │  - Claims        │
                                │  - Predictions   │
                                │  - ModelStats    │
                                └──────────────────┘
```

## 🔄 Request Flow

### 1. User Registration/Login Flow
```
User Browser
    │
    ├─► Vercel (Frontend)
    │       │
    │       ├─► POST /auth/register
    │       │       │
    │       │       └─► Railway (Backend)
    │       │               │
    │       │               ├─► Hash password (bcrypt)
    │       │               │
    │       │               └─► PostgreSQL (Store user)
    │       │
    │       └─► Set session cookie (HTTP-only)
    │
    └─► User logged in
```

### 2. Claim Upload Flow
```
User Browser
    │
    ├─► Vercel (Frontend)
    │       │
    │       ├─► POST /claim/upload (with PDF file)
    │       │       │
    │       │       └─► Railway (Backend)
    │       │               │
    │       │               ├─► Extract data from PDF
    │       │               │
    │       │               ├─► Run fraud detection
    │       │               │
    │       │               ├─► Calculate reserve estimate
    │       │               │
    │       │               └─► PostgreSQL (Store claim + prediction)
    │       │
    │       └─► Display results in UI
    │
    └─► Claim processed
```

## 🌐 Environment Variables

### Vercel (Frontend)
```env
VITE_API_URL=https://your-backend.railway.app
```

### Railway (Backend)
```env
DATABASE_URL=postgresql://... (auto-set by Railway)
SECRET_KEY=your-secret-key
FLASK_ENV=production
FRONTEND_URL=https://your-app.vercel.app
PORT=5000 (auto-set by Railway)
```

## 🔐 Security Flow

### Cookie-Based Authentication
```
1. User logs in via Railway backend
2. Backend sets HTTP-only session cookie
3. Cookie automatically sent with subsequent requests
4. Backend validates session on each request
5. Frontend never sees the session token
```

### CORS Configuration
```
Frontend (Vercel) ──allowed origin──► Backend (Railway)
     │                                      │
     │  credentials: 'include'              │
     │  (sends cookies)                    │
     │                                      │
     └──────────────────────────────────────┘
```

## 📦 Deployment Components

### Frontend (Vercel)
- **Build**: Vite compiles React + TypeScript
- **Output**: Static files in `dist/public`
- **Routing**: SPA routing via `vercel.json` rewrites
- **Environment**: `VITE_API_URL` injected at build time

### Backend (Railway)
- **Runtime**: Python 3.11 (via `runtime.txt`)
- **Server**: Gunicorn WSGI server
- **Database**: PostgreSQL (managed by Railway)
- **Process**: `gunicorn run:app --bind 0.0.0.0:$PORT`

## 🔄 Auto-Deployment

### GitHub Push → Auto Deploy
```
Developer pushes to GitHub
    │
    ├─► Vercel detects push
    │   └─► Builds and deploys frontend
    │
    └─► Railway detects push
        └─► Builds and deploys backend
```

## 📊 Monitoring

### Vercel
- Deployment logs
- Function logs
- Analytics
- Error tracking

### Railway
- Build logs
- Runtime logs
- Metrics (CPU, Memory, Network)
- Database metrics

## 🚨 Troubleshooting Map

```
Issue: CORS Error
    │
    ├─► Check FRONTEND_URL in Railway
    ├─► Verify VITE_API_URL in Vercel
    └─► Check browser console for exact error

Issue: Database Connection Failed
    │
    ├─► Verify DATABASE_URL is set in Railway
    ├─► Check PostgreSQL service is running
    └─► Review Railway logs

Issue: Build Failed
    │
    ├─► Check build logs in Vercel/Railway
    ├─► Verify dependencies in package.json/requirements.txt
    └─► Check for syntax errors
```

---

**Next Steps**: Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for step-by-step instructions.

