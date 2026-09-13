import type { Inputs, Patterns } from './types'

export function PatternSummary({ data, titles }: { data: Patterns; titles: Record<keyof Inputs, string> }) {
  const available = data.metrics.filter(item => item.status === 'available' && item.difference !== null)
  const recentRows = data.series.filter(row => row.date >= data.windows.recent[0] && row.date <= data.windows.recent[1])
  const averages = data.metrics.flatMap(item => {
    const values = recentRows.flatMap(row => {
      const value = row.inputs?.[item.metric]
      return value == null ? [] : [value]
    })
    return values.length ? [{ metric: item.metric, count: values.length, value: values.reduce((a, b) => a + b, 0) / values.length }] : []
  })
  return <>
    {available.length < data.metrics.length && <div className="notice">
      <h3>{available.length ? 'More comparisons are still building' : 'Your weekly comparison is still building'}</h3>
      <p>Keep checking in. Each comparison needs at least 4 check-ins in the last 7 days and 10 in the previous 21 days. Only measures with enough records appear below.</p>
      {!averages.length && <p>No check-ins were recorded in the selected week. Save a check-in or choose another period to see your weekly averages.</p>}
    </div>}
    {!!averages.length && <section aria-label="Weekly averages"><h3>Your week at a glance</h3>
      <p className="small muted">{data.windows.recent.join(' to ')} · Averages of your recorded values. Missing days are excluded.</p>
      <dl className="saved-inputs">{averages.map(item => <div key={item.metric}><dt>{titles[item.metric]}</dt><dd>{item.value.toFixed(1)} {item.metric.endsWith('hours') ? 'hours' : '/ 10'}<small className="block">From {item.count} {item.count === 1 ? 'check-in' : 'check-ins'}</small></dd></div>)}</dl>
    </section>}
    {!!available.length && <section aria-label="Weekly comparisons"><h3>What changed this week?</h3><p className="small muted">Last 7 days ({data.windows.recent.join(' to ')}) compared with the previous 21 days ({data.windows.baseline.join(' to ')}).</p>
      <div className="pattern-grid">{available.map(item => <article key={item.id} className="metric-card"><h4>{titles[item.metric]}</h4>
        <strong>{Math.abs(item.difference!).toFixed(1)} {item.metric.endsWith('hours') ? 'hours' : 'points'} {item.difference! > 0 ? 'higher' : item.difference! < 0 ? 'lower' : 'change'}</strong>
        <p>Typical value: {item.recent_median} this week, compared with {item.baseline_median} earlier.</p>
        <details><summary>How this comparison works</summary><p>Typical values are medians, which reduce the influence of unusually high or low days. Based on {item.recent_count} check-ins this week and {item.baseline_count} in the previous 21 days.</p><p>{item.limitation}</p>
          {item.latest_deviation && <p>On {data.windows.recent[1]}, this value was unusually {item.latest_deviation} than your earlier records.{item.persistent_deviation && ' This also occurred on the previous two days.'}</p>}
          <p>{item.rule}</p>
        </details></article>)}</div>
    </section>}
  </>
}
