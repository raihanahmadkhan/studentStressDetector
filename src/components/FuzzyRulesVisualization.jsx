import { useState } from 'react'
import { ChevronDown, ChevronUp, Zap, Filter } from 'lucide-react'

function FuzzyRulesVisualization({ inputs, membershipDegrees }) {
  const [showAllRules, setShowAllRules] = useState(false)

  const fuzzyRules = [
    { condition: 'Good sleep + Low workload + Low screentime + Balanced activities', output: 'Very Low Stress', priority: 'high' },
    { condition: 'Good sleep + Low workload + Moderate screentime + Balanced activities', output: 'Low Stress', priority: 'high' },
    { condition: 'Good sleep + High workload + Low screentime', output: 'Moderate Stress', priority: 'medium' },
    { condition: 'Good sleep + High workload + High screentime', output: 'High Stress', priority: 'medium' },
    { condition: 'Poor sleep + Low workload + Low screentime', output: 'Moderate Stress', priority: 'medium' },
    { condition: 'Poor sleep + Medium workload', output: 'High Stress', priority: 'high' },
    { condition: 'Poor sleep + High workload', output: 'Very High Stress', priority: 'critical' },
    { condition: 'Poor sleep + High screentime', output: 'Very High Stress', priority: 'critical' },
    { condition: 'Moderate sleep + Low workload + Low screentime + Balanced activities', output: 'Low Stress', priority: 'medium' },
    { condition: 'Moderate sleep + Medium workload + Moderate screentime', output: 'Moderate Stress', priority: 'medium' },
    { condition: 'Moderate sleep + High workload + High screentime', output: 'High Stress', priority: 'high' },
    { condition: 'High screentime + High workload', output: 'Very High Stress', priority: 'critical' },
    { condition: 'High screentime + Poor sleep', output: 'Very High Stress', priority: 'critical' },
    { condition: 'High screentime + Medium workload + Moderate sleep', output: 'High Stress', priority: 'high' },
    { condition: 'Excessive activities + High workload', output: 'Very High Stress', priority: 'critical' },
    { condition: 'Excessive activities + Poor sleep', output: 'Very High Stress', priority: 'critical' },
    { condition: 'Low activities + Low workload + Good sleep', output: 'Low Stress', priority: 'low' },
    { condition: 'Moderate sleep + Medium workload + Low screentime + Balanced activities', output: 'Low Stress', priority: 'medium' },
    { condition: 'Good sleep + Medium workload + Moderate screentime + Balanced activities', output: 'Moderate Stress', priority: 'medium' },
    { condition: 'Low workload + Low screentime + Low activities', output: 'Low Stress', priority: 'low' },
    { condition: 'High workload + Moderate screentime + Moderate sleep', output: 'High Stress', priority: 'high' },
  ]

  const getActiveRules = () => {
    if (!membershipDegrees) return []
    
    const activeRules = []
    const sleep = membershipDegrees.sleep
    const workload = membershipDegrees.workload
    const screentime = membershipDegrees.screentime
    const extra = membershipDegrees.extracurricular

    // Determine dominant memberships (> 0.3 threshold)
    const threshold = 0.3
    
    fuzzyRules.forEach(rule => {
      let isActive = false
      const condition = rule.condition.toLowerCase()
      
      // Check if rule conditions match current memberships
      if (condition.includes('good sleep') && sleep.good > threshold) isActive = true
      if (condition.includes('poor sleep') && sleep.poor > threshold) isActive = true
      if (condition.includes('moderate sleep') && sleep.moderate > threshold) isActive = true
      
      if (condition.includes('high workload') && workload.high > threshold) isActive = true
      if (condition.includes('medium workload') && workload.medium > threshold) isActive = true
      if (condition.includes('low workload') && workload.low > threshold) isActive = true
      
      if (condition.includes('high screentime') && screentime.high > threshold) isActive = true
      if (condition.includes('moderate screentime') && screentime.moderate > threshold) isActive = true
      if (condition.includes('low screentime') && screentime.low > threshold) isActive = true
      
      if (condition.includes('excessive activities') && extra.excessive > threshold) isActive = true
      if (condition.includes('balanced activities') && extra.balanced > threshold) isActive = true
      if (condition.includes('low activities') && extra.low > threshold) isActive = true
      
      if (isActive) {
        activeRules.push(rule)
      }
    })
    
    return activeRules
  }

  const activeRules = getActiveRules()
  const displayRules = showAllRules ? fuzzyRules : activeRules

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#fca5a5' }
      case 'high':
        return { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#fcd34d' }
      case 'medium':
        return { bg: 'rgba(99, 102, 241, 0.1)', border: '#6366f1', text: '#a5b4fc' }
      case 'low':
        return { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', text: '#6ee7b7' }
      default:
        return { bg: 'rgba(99, 102, 241, 0.1)', border: '#6366f1', text: '#a5b4fc' }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header with toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Zap size={20} color="#6366f1" />
          <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '1rem' }}>
            {showAllRules ? 'All Fuzzy Rules' : 'Active Rules'} 
            <span style={{ 
              marginLeft: '0.5rem', 
              color: '#64748b', 
              fontSize: '0.875rem' 
            }}>
              ({displayRules.length})
            </span>
          </span>
        </div>
        <button
          onClick={() => setShowAllRules(!showAllRules)}
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '10px',
            padding: '0.5rem 1rem',
            color: '#a5b4fc',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'
          }}
        >
          <Filter size={16} />
          {showAllRules ? 'Show Active Only' : 'Show All Rules'}
          {showAllRules ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Rules list */}
      <div style={{ 
        display: 'grid',
        gap: '0.875rem',
        maxHeight: showAllRules ? '500px' : 'auto',
        overflowY: showAllRules ? 'auto' : 'visible',
        paddingRight: showAllRules ? '0.5rem' : '0'
      }}>
        {displayRules.length === 0 ? (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            color: '#64748b',
            background: 'rgba(15, 23, 42, 0.3)',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.1)'
          }}>
            No active rules at current input values
          </div>
        ) : (
          displayRules.map((rule, idx) => {
            const colors = getPriorityColor(rule.priority)
            const isActive = activeRules.includes(rule)
            
            return (
              <div
                key={idx}
                style={{
                  background: colors.bg,
                  border: `1px solid ${isActive ? colors.border : 'rgba(99, 102, 241, 0.1)'}`,
                  borderLeft: `4px solid ${colors.border}`,
                  borderRadius: '12px',
                  padding: '1rem',
                  transition: 'all 0.3s ease',
                  opacity: isActive || showAllRules ? 1 : 0.5
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#64748b',
                    minWidth: '2rem'
                  }}>
                    #{idx + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ 
                      color: '#cbd5e1', 
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem',
                      fontWeight: 500
                    }}>
                      IF {rule.condition}
                    </div>
                    <div style={{ 
                      color: colors.text,
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      THEN → {rule.output}
                      {isActive && (
                        <span style={{
                          background: colors.border,
                          color: '#fff',
                          fontSize: '0.625rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: 700
                        }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default FuzzyRulesVisualization
