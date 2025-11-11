import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

function StressChart({ stressPercentage }) {
  const getColor = (percentage) => {
    if (percentage < 25) return '#10b981'
    if (percentage < 45) return '#3b82f6'
    if (percentage < 65) return '#f59e0b'
    if (percentage < 85) return '#f97316'
    return '#ef4444'
  }

  const data = {
    labels: ['Stress Level', 'Remaining'],
    datasets: [
      {
        data: [stressPercentage, 100 - stressPercentage],
        backgroundColor: [
          getColor(stressPercentage),
          '#1f293722'
        ],
        borderColor: [
          getColor(stressPercentage),
          '#1f2937'
        ],
        borderWidth: 2,
        circumference: 180,
        rotation: 270,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
            return context.label + ': ' + context.parsed + '%'
          }
        }
      }
    }
  }

  return (
    <div className="chart-container">
      <Doughnut data={data} options={options} />
    </div>
  )
}

export default StressChart
