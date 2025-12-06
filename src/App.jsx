import { useState, useEffect } from 'react'
import axios from 'axios'
import { Brain, Moon, Briefcase, Monitor, Activity, AlertCircle, TrendingUp, Lightbulb, History, Zap, Download } from 'lucide-react'
import StressChart from './components/StressChart'
import MembershipChart from './components/MembershipChart'
import StressHistory from './components/StressHistory'
import Recommendations from './components/Recommendations'
import FuzzyRulesVisualization from './components/FuzzyRulesVisualization'
import { calculateStressLocal } from './services/stressCalculator'
import './App.css'

function App() {
  const [inputs, setInputs] = useState({
    sleep: 7,
    workload: 5,
    screentime: 6,
    extracurricular: 5
  })

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isLocalMode, setIsLocalMode] = useState(false)
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('stressHistory')
    return saved ? JSON.parse(saved) : []
  })
  const [activeTab, setActiveTab] = useState('overview')

  const calculateStress = async () => {
    setLoading(true)
    setError(null)

    const useLocal = import.meta.env.VITE_USE_LOCAL === 'true'


    if (!useLocal) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const response = await axios.post(`${apiUrl}/api/calculate-stress`, inputs)
        setResult(response.data)
        setIsLocalMode(false)

        const newEntry = {
          timestamp: new Date().toISOString(),
          stress: response.data.stress_percentage,
          inputs: { ...inputs }
        }

        const updatedHistory = [...history, newEntry].slice(-20)
        setHistory(updatedHistory)
        localStorage.setItem('stressHistory', JSON.stringify(updatedHistory))
        setLoading(false)
        return
      } catch (err) {

      }
    }


    try {
      const localResult = await calculateStressLocal(inputs)
      setResult(localResult)
      setIsLocalMode(true)

      const newEntry = {
        timestamp: new Date().toISOString(),
        stress: localResult.stress_percentage,
        inputs: { ...inputs }
      }

      const updatedHistory = [...history, newEntry].slice(-20)
      setHistory(updatedHistory)
      localStorage.setItem('stressHistory', JSON.stringify(updatedHistory))
    } catch (err) {
      setError('Failed to calculate stress. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    calculateStress()
  }, [inputs])

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('stressHistory')
  }

  const exportReport = () => {
    if (!result) return

    const report = {
      timestamp: new Date().toISOString(),
      stress_analysis: {
        percentage: result.stress_percentage,
        label: result.stress_label
      },
      inputs: inputs,
      membership_degrees: result.membership_degrees,
      history: history
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stress-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSliderChange = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: parseFloat(value) }))
  }

  const getStressColor = (percentage) => {
    if (percentage < 25) return '#10b981'
    if (percentage < 45) return '#3b82f6'
    if (percentage < 65) return '#f59e0b'
    if (percentage < 85) return '#f97316'
    return '#ef4444'
  }

  const getStressGradient = (percentage) => {
    const color = getStressColor(percentage)
    return `linear-gradient(135deg, ${color}22, ${color}44)`
  }

  return (
    <div className="app">
      <div className="background-gradient"></div>

      <div className="container">
        <header className="header">
          <div className="header-content">
            <div className="logo">
              <Brain className="logo-icon" size={40} />
              <div>
                <h1>Student Stress Detector</h1>
                <p className="subtitle">
                  Powered by Mamdani Fuzzy Inference System
                  {isLocalMode && <span style={{ marginLeft: '0.5rem', color: '#3b82f6' }}>• Local Mode</span>}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="content-grid">
          <div className="card controls-card">
            <h2 className="card-title">
              <Activity size={24} />
              Input Parameters
            </h2>

            <div className="controls">
              <div className="control-group">
                <div className="control-header">
                  <Moon size={20} />
                  <label>Sleep Hours</label>
                  <span className="value-badge">{inputs.sleep}h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={inputs.sleep}
                  onChange={(e) => handleSliderChange('sleep', e.target.value)}
                  className="slider sleep-slider"
                />
                <div className="slider-labels">
                  <span>0h</span>
                  <span>6h</span>
                  <span>12h</span>
                </div>
              </div>

              <div className="control-group">
                <div className="control-header">
                  <Briefcase size={20} />
                  <label>Academic Workload</label>
                  <span className="value-badge">{inputs.workload}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={inputs.workload}
                  onChange={(e) => handleSliderChange('workload', e.target.value)}
                  className="slider workload-slider"
                />
                <div className="slider-labels">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>

              <div className="control-group">
                <div className="control-header">
                  <Monitor size={20} />
                  <label>Screen Time</label>
                  <span className="value-badge">{inputs.screentime}h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="0.5"
                  value={inputs.screentime}
                  onChange={(e) => handleSliderChange('screentime', e.target.value)}
                  className="slider screentime-slider"
                />
                <div className="slider-labels">
                  <span>0h</span>
                  <span>8h</span>
                  <span>16h</span>
                </div>
              </div>

              <div className="control-group">
                <div className="control-header">
                  <TrendingUp size={20} />
                  <label>Extracurricular Activities</label>
                  <span className="value-badge">{inputs.extracurricular}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={inputs.extracurricular}
                  onChange={(e) => handleSliderChange('extracurricular', e.target.value)}
                  className="slider extra-slider"
                />
                <div className="slider-labels">
                  <span>None</span>
                  <span>Balanced</span>
                  <span>Excessive</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card results-card">
            <h2 className="card-title">
              <Brain size={24} />
              Stress Analysis
            </h2>

            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Analyzing stress levels...</p>
              </div>
            )}

            {error && (
              <div className="error">
                <AlertCircle size={24} />
                <p>{error}</p>
              </div>
            )}

            {result && !loading && (
              <div className="results">
                <div
                  className="stress-display"
                  style={{ background: getStressGradient(result.stress_percentage) }}
                >
                  <div className="stress-percentage">
                    {result.stress_percentage}%
                  </div>
                  <div className="stress-label" style={{ color: getStressColor(result.stress_percentage) }}>
                    {result.stress_label}
                  </div>
                </div>

                <div className="fuzzy-info">
                  <div className="info-item">
                    <span className="info-label">Inference Type:</span>
                    <span className="info-value">{result.fuzzy_details.inference_type}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Defuzzification:</span>
                    <span className="info-value">{result.fuzzy_details.defuzzification}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Active Rules:</span>
                    <span className="info-value">{result.fuzzy_details.total_rules}</span>
                  </div>
                </div>

                <StressChart stressPercentage={result.stress_percentage} />
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="tabs-container">
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <Activity size={18} />
                Overview
              </button>
              <button
                className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
                onClick={() => setActiveTab('recommendations')}
              >
                <Lightbulb size={18} />
                Recommendations
              </button>
              <button
                className={`tab ${activeTab === 'rules' ? 'active' : ''}`}
                onClick={() => setActiveTab('rules')}
              >
                <Zap size={18} />
                Fuzzy Rules
              </button>
              <button
                className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={18} />
                History
              </button>
            </div>

            <div className="card tab-content">
              {activeTab === 'overview' && (
                <>
                  <h2 className="card-title">
                    <Activity size={24} />
                    Fuzzy Membership Degrees
                  </h2>
                  <MembershipChart membershipDegrees={result.membership_degrees} />
                </>
              )}

              {activeTab === 'recommendations' && (
                <>
                  <h2 className="card-title">
                    <Lightbulb size={24} />
                    Personalized Recommendations
                  </h2>
                  <Recommendations stressLevel={result.stress_percentage} inputs={inputs} />
                </>
              )}

              {activeTab === 'rules' && (
                <>
                  <h2 className="card-title">
                    <Zap size={24} />
                    Fuzzy Inference Rules
                  </h2>
                  <FuzzyRulesVisualization
                    inputs={inputs}
                    membershipDegrees={result.membership_degrees}
                  />
                </>
              )}

              {activeTab === 'history' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 className="card-title" style={{ marginBottom: 0 }}>
                      <History size={24} />
                      Stress Trends
                    </h2>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={exportReport}
                        className="action-button"
                        style={{
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#6ee7b7'
                        }}
                      >
                        <Download size={16} />
                        Export Report
                      </button>
                      {history.length > 0 && (
                        <button
                          onClick={clearHistory}
                          className="action-button"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#fca5a5'
                          }}
                        >
                          Clear History
                        </button>
                      )}
                    </div>
                  </div>
                  <StressHistory history={history} />
                </>
              )}
            </div>
          </div>
        )}

        <footer className="footer">
          <p>Built with React, FastAPI, and scikit-fuzzy • Mamdani Fuzzy Inference System</p>
        </footer>
      </div>
    </div>
  )
}

export default App
