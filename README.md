# 🧠 Student Stress Detector

AI-powered web application using Mamdani Fuzzy Inference System to analyze student stress levels.

![React](https://img.shields.io/badge/React-18.3.1-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-green)
![Python](https://img.shields.io/badge/Python-3.8+-yellow)

## ✨ Features

- **Real-time Stress Analysis** - Instant feedback as you adjust parameters
- **Mamdani Fuzzy Inference System** - 21 expert-defined fuzzy rules
- **Client-side Mode** - Works without backend using local fuzzy logic calculation
- **Beautiful Modern UI** - Gradient backgrounds, smooth animations, glassmorphism
- **Interactive Sliders** - Control 4 input parameters with visual feedback
- **Chart.js Visualizations** - Doughnut chart for stress level, bar charts for membership degrees
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Stress History Tracking** - Track and visualize stress trends over time
- **Export Reports** - Download stress analysis reports as JSON

## 🧮 Fuzzy Logic Implementation

### Input Variables
1. **Sleep Hours** (0-12h): Poor, Moderate, Good
2. **Academic Workload** (0-10): Low, Medium, High
3. **Screen Time** (0-16h): Low, Moderate, High
4. **Extracurricular Activities** (0-10): Low, Balanced, Excessive
### Output Variable
- **Stress Level** (0-100%): Very Low, Low, Moderate, High, Very High

### Fuzzy Rules Examples
- Poor sleep + High workload → Very High Stress
- Good sleep + Low workload + Balanced activities → Very Low Stress
- High screentime + High workload → Very High Stress
- Moderate sleep + Medium workload + Low screentime → Low Stress

### Defuzzification
Uses **centroid method** to convert fuzzy output to crisp stress percentage.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ and pip (optional - only needed for backend mode)

### Quick Start (Local Mode - No Backend Required)

The app can run entirely in the browser without the Python backend:

```bash
npm install
npm run dev
```

The frontend will run on `http://localhost:5173` and automatically use client-side fuzzy logic calculation.

### Full Setup (With Backend)

For the full experience with Python's scikit-fuzzy library:

**1. Backend Setup**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend will run on `http://localhost:8000`

**2. Frontend Setup**
```bash
npm install
npm run dev
```

### Configuration

Create a `.env` file in the root directory:

```bash
# Use backend API (default)
VITE_API_URL=http://localhost:8000

# Force local mode (optional)
# VITE_USE_LOCAL=true
```

**Local Mode Behavior:**
- If `VITE_USE_LOCAL=true`: Forces client-side calculation
- If backend unavailable: Automatically falls back to client-side calculation
- Client-side implementation matches backend fuzzy logic exactly

## 📦 Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Chart.js** - Data visualization
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client

### Backend
- **FastAPI** - Modern Python web framework
- **scikit-fuzzy** - Fuzzy logic toolkit
- **NumPy** - Numerical computing
- **Pydantic** - Data validation

## 🎨 UI Features

- **Glassmorphism cards** with backdrop blur
- **Gradient backgrounds** with animated radial gradients
- **Color-coded stress levels** (green → blue → yellow → orange → red)
- **Smooth animations** (fade in, scale, pulse effects)
- **Interactive sliders** with gradient backgrounds
- **Real-time updates** as you adjust parameters

## 📊 Visualizations

1. **Stress Gauge** - Doughnut chart showing stress percentage
2. **Membership Degree Charts** - Bar charts for each fuzzy variable showing membership degrees
3. **Color-coded Results** - Visual feedback based on stress level

## 🔬 How It Works

### Backend Mode
1. User adjusts sliders for sleep, workload, screentime, and extracurricular activities
2. Frontend sends input values to FastAPI backend via POST request
3. Backend creates fuzzy variables with membership functions (triangular/trapezoidal)
4. Mamdani inference engine evaluates 21 fuzzy rules using scikit-fuzzy
5. Centroid defuzzification converts fuzzy output to stress percentage
6. Backend returns stress level, label, and membership degrees
7. Frontend displays results with beautiful charts and visualizations

### Local Mode (No Backend)
1. User adjusts sliders for sleep, workload, screentime, and extracurricular activities
2. Client-side JavaScript calculates membership degrees using triangular/trapezoidal functions
3. Local inference engine evaluates same 21 fuzzy rules with weighted activation
4. Simplified centroid defuzzification calculates stress percentage
5. Results displayed with same visualizations as backend mode
6. All data stored in browser's localStorage (history tracking)

## 📝 API Endpoints

- `POST /api/calculate-stress` - Calculate stress level
  - Request body: `{ sleep, workload, screentime, extracurricular }`
  - Response: `{ stress_percentage, stress_label, membership_degrees, fuzzy_details }`
- `GET /api/health` - Health check
- `GET /` - API info

## 🎯 Future Enhancements

- Add historical tracking and trends
- Export stress reports as PDF
- Personalized recommendations based on stress level
- Machine learning integration for rule optimization
- Multi-language support

## 📄 License

MIT License - Feel free to use this project for learning and development!

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

Built with ❤️ using React, FastAPI, and Fuzzy Logic
