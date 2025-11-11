# 🧠 Student Stress Detector

AI-powered web application using Mamdani Fuzzy Inference System to analyze student stress levels.

![React](https://img.shields.io/badge/React-18.3.1-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-green)
![Python](https://img.shields.io/badge/Python-3.8+-yellow)

## ✨ Features

- **Real-time Stress Analysis** - Instant feedback as you adjust parameters
- **Mamdani Fuzzy Inference System** - 21 expert-defined fuzzy rules
- **Beautiful Modern UI** - Gradient backgrounds, smooth animations, glassmorphism
- **Interactive Sliders** - Control 4 input parameters with visual feedback
- **Chart.js Visualizations** - Doughnut chart for stress level, bar charts for membership degrees
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

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
- Python 3.8+
- pip

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend will run on `http://localhost:8000`

### Frontend Setup

```bash
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

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

1. User adjusts sliders for sleep, workload, screentime, and extracurricular activities
2. Frontend sends input values to FastAPI backend via POST request
3. Backend creates fuzzy variables with membership functions (triangular/trapezoidal)
4. Mamdani inference engine evaluates 21 fuzzy rules
5. Centroid defuzzification converts fuzzy output to stress percentage
6. Backend returns stress level, label, and membership degrees
7. Frontend displays results with beautiful charts and visualizations

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
