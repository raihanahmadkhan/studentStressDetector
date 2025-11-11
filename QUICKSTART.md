# Quick Start Guide

## Local Development

### 1. Install Dependencies
```bash
npm install
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Start Development Servers

**Option A: Automated (Windows)**
```bash
start.bat
```

**Option B: Manual**

Terminal 1 (Backend):
```bash
cd backend
uvicorn main:app --reload --port 8000
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### 3. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Production Deployment

### Frontend (Vercel - Recommended)
```bash
npm install -g vercel
vercel
```

### Backend (Railway - Recommended)
```bash
npm install -g railway
cd backend
railway login
railway init
railway up
```

### Update API URL
After deploying backend, update `.env`:
```
VITE_API_URL=https://your-backend-url.railway.app
```

Then redeploy frontend.

## Features
- ✨ Real-time stress analysis
- 📊 Interactive visualizations
- 📈 Stress history tracking
- 💡 Personalized recommendations
- ⚡ Fuzzy rules visualization
- 📥 Export reports

## Tech Stack
- **Frontend**: React + Vite + Chart.js
- **Backend**: FastAPI + scikit-fuzzy
- **AI**: Mamdani Fuzzy Inference System

## Support
For detailed deployment instructions, see DEPLOYMENT.md
