# Quick Start Guide

## 🚀 Get Your Reinsurance App Running in 5 Minutes

### Prerequisites
- Python 3.11
- Node.js 22+
- pnpm

### Step 1: Start the Backend (2 minutes)

```bash
# Navigate to backend
cd Backend

# Install dependencies (if not already installed)
sudo pip3 install Flask Flask-RESTful Flask-SQLAlchemy Flask-CORS bcrypt python-dotenv scikit-learn joblib xgboost

# Start the server
python3.11 run.py
```

✅ Backend should be running on `http://127.0.0.1:5000`

### Step 2: Start the Frontend (2 minutes)

```bash
# Open a new terminal
cd Frontend

# Install dependencies (first time only)
pnpm install

# Start development server
pnpm dev
```

✅ Frontend should be running on `http://localhost:5173`

### Step 3: Create Your First Account (1 minute)

1. Open browser to `http://localhost:5173`
2. Click "Register" or "Sign Up"
3. Fill in the form:
   - Email: `admin@example.com`
   - Password: `admin123`
   - First Name: `Admin`
   - Last Name: `User`
   - Role: `admin`
4. Click "Register"
5. You'll be automatically logged in

### Step 4: Explore the Dashboard

You should now see:
- 📊 **Dashboard** with beautiful graphs
- 📁 **Upload Claims** functionality
- 📋 **Claims List** (empty for now)
- 📈 **Analytics** page

### What's Working Right Now

✅ **Authentication**: Cookie-based, secure login/logout  
✅ **Database**: SQLite (auto-created at `Backend/reinsurance.db`)  
✅ **Fraud Detection**: Rule-based system (no training needed)  
✅ **Reserve Estimation**: Rule-based system  
✅ **Dashboard Graphs**: Pie charts, bar charts, line charts  
✅ **Claims Management**: Upload, view, update, delete  

### Test the System

#### Upload a Test Claim

1. Go to "Upload Claim" page
2. Upload any PDF file (the system will generate mock data)
3. View the fraud prediction and reserve estimate
4. Check the dashboard to see updated statistics

#### API Testing (Optional)

```bash
# Register
curl -X POST http://127.0.0.1:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","first_name":"Test","last_name":"User","role":"insurer"}'

# Login
curl -c cookies.txt -X POST http://127.0.0.1:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get profile
curl -b cookies.txt http://127.0.0.1:5000/auth/profile

# Get dashboard stats
curl -b cookies.txt http://127.0.0.1:5000/claim/report
```

### Troubleshooting

#### Backend won't start
```bash
# Check if port 5000 is in use
netstat -tuln | grep 5000

# Kill existing process
pkill -f "python.*run.py"

# Restart
cd Backend && python3.11 run.py
```

#### Frontend won't start
```bash
# Clear node modules and reinstall
cd Frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

#### Can't login
- Clear browser cookies
- Check backend is running
- Verify credentials are correct

### Next Steps

1. 📖 Read `INTEGRATION_GUIDE.md` for detailed documentation
2. 🤖 Read `ML_TRAINING_PLAN.md` to train ML models
3. 🎨 Customize the frontend theme and branding
4. 📊 Add real claim data for better insights
5. 🚀 Deploy to production

### File Structure

```
reinsurance/
├── Backend/
│   ├── app/                    # Application code
│   ├── ml_models/              # Trained models (optional)
│   ├── uploads/                # Uploaded PDFs
│   ├── reinsurance.db         # SQLite database
│   ├── run.py                  # Start here
│   └── .env                    # Configuration
├── Frontend/
│   ├── client/src/            # React application
│   ├── package.json
│   └── .env                    # API URL config
├── INTEGRATION_GUIDE.md       # Detailed docs
├── ML_TRAINING_PLAN.md        # ML training guide
└── QUICK_START.md             # This file
```

### Key Features

#### 🔐 Authentication
- Secure HTTP-only cookie sessions
- Role-based access (admin/insurer)
- Password hashing with bcrypt

#### 📊 Dashboard
- Real-time statistics
- Beautiful charts (Recharts)
- Claims by status
- Fraud detection overview
- Trend analysis

#### 🤖 ML/AI
- Rule-based fraud detection (active)
- Rule-based reserve estimation (active)
- Optional ML models (trainable)
- Automatic fallback system

#### 📁 Claims Management
- PDF upload
- Automatic data extraction (mock)
- Fraud scoring
- Reserve estimation
- Status tracking

### Default Ports

- **Backend**: `http://127.0.0.1:5000`
- **Frontend**: `http://localhost:5173`
- **Database**: `Backend/reinsurance.db` (file-based)

### Environment Variables

Backend (`.env`):
```
FLASK_ENV=development
SECRET_KEY=your-secret-key
UPLOAD_FOLDER=uploads
```

Frontend (`.env`):
```
VITE_API_URL=http://localhost:5000
```

### Support

For issues or questions:
1. Check `INTEGRATION_GUIDE.md` troubleshooting section
2. Review error messages in terminal
3. Verify all dependencies are installed
4. Ensure both backend and frontend are running

---

**🎉 Congratulations! Your reinsurance application is now running!**

Explore the features, upload some claims, and check out the beautiful dashboard graphs. When you're ready to train ML models, refer to `ML_TRAINING_PLAN.md`.
