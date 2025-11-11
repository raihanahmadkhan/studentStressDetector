import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

function MembershipChart({ membershipDegrees }) {
  // Prepare data for each input variable
  const prepareChartData = (variableName, degrees) => {
    const labels = Object.keys(degrees)
    const values = Object.values(degrees)
    
    const colors = {
      sleep: '#8b5cf6',
      workload: '#3b82f6',
      screentime: '#f59e0b',
      extracurricular: '#10b981',
      stress: '#ef4444'
    }

    return {
      labels: labels.map(l => l.replace('_', ' ').toUpperCase()),
      datasets: [
        {
          label: 'Membership Degree',
          data: values,
          backgroundColor: colors[variableName] + '88',
          borderColor: colors[variableName],
          borderWidth: 2,
          borderRadius: 6,
        }
      ]
    }
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11
          }
        },
        grid: {
          color: '#374151',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: '#9ca3af',
          font: {
            size: 10
          }
        },
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return 'Degree: ' + context.parsed.y.toFixed(3)
          }
        }
      }
    }
  }

  return (
    <div className="membership-charts">
      <div className="membership-chart-item">
        <h3 className="chart-label">
          <span className="color-dot" style={{ backgroundColor: '#8b5cf6' }}></span>
          Sleep
        </h3>
        <div className="chart-wrapper">
          <Bar data={prepareChartData('sleep', membershipDegrees.sleep)} options={options} />
        </div>
      </div>

      <div className="membership-chart-item">
        <h3 className="chart-label">
          <span className="color-dot" style={{ backgroundColor: '#3b82f6' }}></span>
          Workload
        </h3>
        <div className="chart-wrapper">
          <Bar data={prepareChartData('workload', membershipDegrees.workload)} options={options} />
        </div>
      </div>

      <div className="membership-chart-item">
        <h3 className="chart-label">
          <span className="color-dot" style={{ backgroundColor: '#f59e0b' }}></span>
          Screen Time
        </h3>
        <div className="chart-wrapper">
          <Bar data={prepareChartData('screentime', membershipDegrees.screentime)} options={options} />
        </div>
      </div>

      <div className="membership-chart-item">
        <h3 className="chart-label">
          <span className="color-dot" style={{ backgroundColor: '#10b981' }}></span>
          Extracurricular
        </h3>
        <div className="chart-wrapper">
          <Bar data={prepareChartData('extracurricular', membershipDegrees.extracurricular)} options={options} />
        </div>
      </div>

      <div className="membership-chart-item stress-output">
        <h3 className="chart-label">
          <span className="color-dot" style={{ backgroundColor: '#ef4444' }}></span>
          Stress Output
        </h3>
        <div className="chart-wrapper">
          <Bar data={prepareChartData('stress', membershipDegrees.stress)} options={options} />
        </div>
      </div>
    </div>
  )
}

export default MembershipChart
