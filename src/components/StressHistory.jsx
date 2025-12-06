import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { TrendingUp, Calendar, BarChart3, TrendingDown, Minus } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
)

function StressHistory({ history }) {
  if (!history || history.length === 0) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        color: '#94a3b8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <BarChart3 size={48} style={{ opacity: 0.5 }} />
        <p>No history data yet. Adjust the sliders to start tracking your stress levels.</p>
      </div>
    )
  }


  const getStressColor = (value) => {
    if (value < 25) return '#10b981'
    if (value < 45) return '#3b82f6'
    if (value < 65) return '#f59e0b'
    if (value < 85) return '#f97316'
    return '#ef4444'
  }


  const createGradient = (ctx, chartArea) => {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.1)')
    gradient.addColorStop(0.25, 'rgba(59, 130, 246, 0.15)')
    gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)')
    gradient.addColorStop(0.75, 'rgba(249, 115, 22, 0.25)')
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.3)')
    return gradient
  }

  const data = {
    labels: history.map((entry, idx) => {
      const date = new Date(entry.timestamp)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffMins < 1440) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }),
    datasets: [
      {
        label: 'Stress Level',
        data: history.map(entry => entry.stress),
        borderColor: (context) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return '#6366f1'

          const gradient = ctx.createLinearGradient(0, 0, chartArea.width, 0)
          history.forEach((entry, idx) => {
            const position = idx / (history.length - 1)
            gradient.addColorStop(position, getStressColor(entry.stress))
          })
          return gradient
        },
        backgroundColor: (context) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return 'rgba(99, 102, 241, 0.1)'
          return createGradient(ctx, chartArea)
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: (context) => {
          const index = context.dataIndex
          return index === history.length - 1 ? 8 : 5
        },
        pointHoverRadius: 9,
        pointBackgroundColor: (context) => {
          const value = context.parsed.y
          return getStressColor(value)
        },
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        segment: {
          borderColor: (context) => {
            const value = context.p1.parsed.y
            return getStressColor(value)
          }
        }
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        borderColor: (context) => {
          const value = context.tooltip.dataPoints[0].parsed.y
          return getStressColor(value)
        },
        borderWidth: 2,
        padding: 16,
        displayColors: false,
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 14,
          weight: '600'
        },
        callbacks: {
          title: function (context) {
            return context[0].label
          },
          label: function (context) {
            const value = context.parsed.y
            let level = ''
            if (value < 25) level = 'Very Low'
            else if (value < 45) level = 'Low'
            else if (value < 65) level = 'Moderate'
            else if (value < 85) level = 'High'
            else level = 'Very High'

            return `${value.toFixed(1)}% - ${level} Stress`
          },
          afterLabel: function (context) {
            const entry = history[context.dataIndex]
            if (entry.inputs) {
              return [
                '',
                `Sleep: ${entry.inputs.sleep}h`,
                `Workload: ${entry.inputs.workload}/10`,
                `Screen: ${entry.inputs.screentime}h`,
                `Activities: ${entry.inputs.extracurricular}/10`
              ]
            }
            return ''
          }
        }
      },
      annotation: {
        annotations: {
          line1: {
            type: 'line',
            yMin: 25,
            yMax: 25,
            borderColor: 'rgba(16, 185, 129, 0.3)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: 'Low Threshold',
              position: 'end',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#6ee7b7',
              font: {
                size: 10,
                weight: 'bold'
              }
            }
          },
          line2: {
            type: 'line',
            yMin: 65,
            yMax: 65,
            borderColor: 'rgba(245, 158, 11, 0.3)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: 'High Threshold',
              position: 'end',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: '#fcd34d',
              font: {
                size: 10,
                weight: 'bold'
              }
            }
          },
          line3: {
            type: 'line',
            yMin: 85,
            yMax: 85,
            borderColor: 'rgba(239, 68, 68, 0.3)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: 'Critical',
              position: 'end',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              font: {
                size: 10,
                weight: 'bold'
              }
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#9ca3af',
          font: {
            size: 12,
            weight: '500'
          },
          callback: function (value) {
            return value + '%'
          },
          stepSize: 20
        },
        grid: {
          color: (context) => {
            if (context.tick.value === 25 || context.tick.value === 65 || context.tick.value === 85) {
              return 'rgba(99, 102, 241, 0.15)'
            }
            return 'rgba(55, 65, 81, 0.5)'
          },
          drawBorder: false,
          lineWidth: 1
        }
      },
      x: {
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
            weight: '500'
          },
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 10
        },
        grid: {
          display: false
        }
      }
    }
  }


  const avgStress = history.reduce((sum, entry) => sum + entry.stress, 0) / history.length
  const maxStress = Math.max(...history.map(entry => entry.stress))
  const minStress = Math.min(...history.map(entry => entry.stress))


  const getTrend = () => {
    if (history.length < 2) return { direction: 'stable', percentage: 0 }

    const recent = history.slice(-5)
    const older = history.slice(0, Math.min(5, history.length - 5))

    if (older.length === 0) return { direction: 'stable', percentage: 0 }

    const recentAvg = recent.reduce((sum, e) => sum + e.stress, 0) / recent.length
    const olderAvg = older.reduce((sum, e) => sum + e.stress, 0) / older.length

    const diff = recentAvg - olderAvg
    const percentChange = ((diff / olderAvg) * 100)

    if (Math.abs(diff) < 3) return { direction: 'stable', percentage: 0 }
    if (diff > 0) return { direction: 'up', percentage: percentChange }
    return { direction: 'down', percentage: Math.abs(percentChange) }
  }

  const trend = getTrend()

  const getTrendIcon = () => {
    if (trend.direction === 'up') return <TrendingUp size={14} />
    if (trend.direction === 'down') return <TrendingDown size={14} />
    return <Minus size={14} />
  }

  const getTrendColor = () => {
    if (trend.direction === 'up') return '#ef4444'
    if (trend.direction === 'down') return '#10b981'
    return '#6366f1'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem'
      }}>
        <div className="info-item">
          <span className="info-label">
            <BarChart3 size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Average
          </span>
          <span className="info-value">{avgStress.toFixed(1)}%</span>
        </div>
        <div className="info-item">
          <span className="info-label">
            <Calendar size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Peak
          </span>
          <span className="info-value" style={{ color: '#fca5a5' }}>{maxStress.toFixed(1)}%</span>
        </div>
        <div className="info-item">
          <span className="info-label">
            <TrendingDown size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Lowest
          </span>
          <span className="info-value" style={{ color: '#6ee7b7' }}>{minStress.toFixed(1)}%</span>
        </div>
        <div className="info-item" style={{
          borderColor: getTrendColor() + '40',
          background: getTrendColor() + '10'
        }}>
          <span className="info-label">
            {getTrendIcon()}
            <span style={{ marginLeft: '0.5rem' }}>Trend</span>
          </span>
          <span className="info-value" style={{ color: getTrendColor() }}>
            {trend.direction === 'stable' ? 'Stable' :
              trend.direction === 'up' ? `↑ ${trend.percentage.toFixed(0)}%` :
                `↓ ${trend.percentage.toFixed(0)}%`}
          </span>
        </div>
      </div>


      <div style={{
        background: 'rgba(15, 23, 42, 0.2)',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid rgba(99, 102, 241, 0.08)'
      }}>
        <div style={{ height: '350px' }}>
          <Line data={data} options={options} />
        </div>
      </div>


      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 0.5rem',
        borderTop: '1px solid rgba(99, 102, 241, 0.1)',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{
          color: '#64748b',
          fontSize: '0.875rem',
          fontWeight: 500
        }}>
          📊 {history.length} {history.length === 1 ? 'entry' : 'entries'} recorded
        </div>
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '3px', background: '#10b981', borderRadius: '2px' }}></div>
            <span>Low (&lt;25%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '3px', background: '#f59e0b', borderRadius: '2px' }}></div>
            <span>Moderate (25-65%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '3px', background: '#ef4444', borderRadius: '2px' }}></div>
            <span>High (&gt;65%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StressHistory
