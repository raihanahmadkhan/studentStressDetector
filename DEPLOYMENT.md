# Deployment Guide

## Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

## Frontend Deployment (Vercel/Netlify)

### Option 1: Vercel
1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow prompts and configure:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Option 2: Netlify
1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
netlify deploy --prod
```

3. Configure:
   - Build Command: `npm run build`
   - Publish Directory: `dist`

## Backend Deployment (Railway/Render)

### Option 1: Railway
1. Create `Procfile` in backend folder:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

2. Push to Railway:
```bash
railway login
railway init
railway up
```

### Option 2: Render
1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: stress-detector-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

2. Connect GitHub repo and deploy

## Environment Variables

### Frontend
Update API endpoint in `src/App.jsx`:
```javascript
const response = await axios.post('YOUR_BACKEND_URL/api/calculate-stress', inputs)
```

### Backend
No environment variables needed for basic deployment.

## Post-Deployment
1. Test all features
2. Verify CORS settings
3. Monitor performance
4. Set up custom domain (optional)
