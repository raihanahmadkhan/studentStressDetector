import { Lightbulb, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

function Recommendations({ stressLevel, inputs }) {
  const getRecommendations = () => {
    const recommendations = []
    
    // Sleep recommendations
    if (inputs.sleep < 6) {
      recommendations.push({
        type: 'critical',
        category: 'Sleep',
        message: 'Critical: You need more sleep! Aim for 7-9 hours per night.',
        action: 'Set a consistent bedtime and avoid screens 1 hour before sleep.'
      })
    } else if (inputs.sleep < 7) {
      recommendations.push({
        type: 'warning',
        category: 'Sleep',
        message: 'Try to get at least 7 hours of sleep for optimal recovery.',
        action: 'Establish a relaxing bedtime routine.'
      })
    } else {
      recommendations.push({
        type: 'success',
        category: 'Sleep',
        message: 'Great sleep habits! Keep it up.',
        action: 'Maintain your current sleep schedule.'
      })
    }

    // Workload recommendations
    if (inputs.workload > 7) {
      recommendations.push({
        type: 'critical',
        category: 'Workload',
        message: 'Your workload is very high. Consider prioritizing tasks.',
        action: 'Use the Eisenhower Matrix to prioritize urgent vs important tasks.'
      })
    } else if (inputs.workload > 5) {
      recommendations.push({
        type: 'warning',
        category: 'Workload',
        message: 'Moderate workload detected. Stay organized.',
        action: 'Break large tasks into smaller, manageable chunks.'
      })
    } else {
      recommendations.push({
        type: 'success',
        category: 'Workload',
        message: 'Your workload is manageable.',
        action: 'Good balance! Consider taking on new learning opportunities.'
      })
    }

    // Screen time recommendations
    if (inputs.screentime > 10) {
      recommendations.push({
        type: 'critical',
        category: 'Screen Time',
        message: 'Excessive screen time detected! Take regular breaks.',
        action: 'Follow the 20-20-20 rule: Every 20 min, look 20 feet away for 20 seconds.'
      })
    } else if (inputs.screentime > 6) {
      recommendations.push({
        type: 'warning',
        category: 'Screen Time',
        message: 'Consider reducing screen time for better eye health.',
        action: 'Use blue light filters and take hourly breaks.'
      })
    } else {
      recommendations.push({
        type: 'success',
        category: 'Screen Time',
        message: 'Healthy screen time balance.',
        action: 'Keep maintaining this healthy balance.'
      })
    }

    // Extracurricular recommendations
    if (inputs.extracurricular > 7) {
      recommendations.push({
        type: 'warning',
        category: 'Activities',
        message: 'You might be overcommitted with extracurriculars.',
        action: 'Focus on quality over quantity. Choose activities you truly enjoy.'
      })
    } else if (inputs.extracurricular < 2) {
      recommendations.push({
        type: 'warning',
        category: 'Activities',
        message: 'Consider joining more activities for social engagement.',
        action: 'Find 1-2 activities that align with your interests.'
      })
    } else {
      recommendations.push({
        type: 'success',
        category: 'Activities',
        message: 'Well-balanced extracurricular involvement.',
        action: 'Great balance between academics and activities!'
      })
    }

    // Overall stress recommendations
    if (stressLevel > 75) {
      recommendations.push({
        type: 'critical',
        category: 'Overall',
        message: 'High stress detected! Consider seeking support.',
        action: 'Talk to a counselor, practice meditation, or try deep breathing exercises.'
      })
    } else if (stressLevel > 50) {
      recommendations.push({
        type: 'warning',
        category: 'Overall',
        message: 'Moderate stress levels. Practice self-care.',
        action: 'Schedule regular breaks, exercise, and maintain social connections.'
      })
    }

    return recommendations
  }

  const recommendations = getRecommendations()

  const getIcon = (type) => {
    switch (type) {
      case 'critical':
        return <XCircle size={20} color="#ef4444" />
      case 'warning':
        return <AlertTriangle size={20} color="#f59e0b" />
      case 'success':
        return <CheckCircle2 size={20} color="#10b981" />
      default:
        return <Lightbulb size={20} color="#6366f1" />
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.3)',
          text: '#fca5a5'
        }
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.1)',
          border: 'rgba(245, 158, 11, 0.3)',
          text: '#fcd34d'
        }
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.3)',
          text: '#6ee7b7'
        }
      default:
        return {
          bg: 'rgba(99, 102, 241, 0.1)',
          border: 'rgba(99, 102, 241, 0.3)',
          text: '#a5b4fc'
        }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {recommendations.map((rec, idx) => {
        const colors = getTypeColor(rec.type)
        return (
          <div
            key={idx}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              padding: '1.25rem',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.bg.replace('0.1', '0.15')
              e.currentTarget.style.transform = 'translateX(4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.bg
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                {getIcon(rec.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: colors.text,
                    background: colors.bg.replace('0.1', '0.2'),
                    padding: '0.25rem 0.625rem',
                    borderRadius: '6px'
                  }}>
                    {rec.category}
                  </span>
                </div>
                <p style={{
                  color: '#e2e8f0',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  marginBottom: '0.625rem',
                  lineHeight: 1.5
                }}>
                  {rec.message}
                </p>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  lineHeight: 1.6
                }}>
                  💡 {rec.action}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Recommendations
