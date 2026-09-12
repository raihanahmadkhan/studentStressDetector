import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { CheckIn, Inputs, Patterns } from './types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

export function FuzzyChart({ assessment }: { assessment: Pick<CheckIn['assessment'], 'aggregate'> & { id?: string } }) {
  if (!assessment.aggregate.universe.length) return null
  return <figure><div className="chart"><Line aria-label="Aggregated fuzzy output membership; centroid stated below" role="img"
    data={{ datasets: [{ label: 'Aggregated membership', data: assessment.aggregate.universe.map((x, i) => ({ x, y: assessment.aggregate.membership[i] })), borderColor: '#236d58', backgroundColor: '#236d5830', fill: true, pointRadius: 0 }] }}
    options={{ animation: false, responsive: true, maintainAspectRatio: false, scales: { x: { type: 'linear', min: 0, max: 100, title: { display: true, text: 'Fuzzy output (0–100)' } }, y: { min: 0, max: 1, title: { display: true, text: 'Membership degree' } } } }} /></div><figcaption>{assessment.id ? 'Sum of the product-scaled output sets; component centroid reported above.' : 'Maximum of the clipped output sets; the numerical centroid is reported below.'}</figcaption></figure>
}

export function PatternChart({ patterns, metric, label }: { patterns: Patterns; metric: keyof Inputs; label: string }) {
  const hours = metric.endsWith('hours')
  return <div className="chart"><Line role="img" aria-label={`${label}: daily observations and seven-day rolling mean. A complete data table follows.`}
    data={{ labels: patterns.series.map(p => p.date), datasets: [
      { label, data: patterns.series.map(p => p.inputs?.[metric] ?? null), borderColor: '#236d58', backgroundColor: '#236d58', pointRadius: 4, spanGaps: false, tension: 0 },
      { label: '7-day mean (at least 4 reports)', data: patterns.series.map(p => p.rolling_mean[metric]), borderColor: '#b67432', borderDash: [5, 5], pointRadius: 0, spanGaps: false, tension: 0 },
    ] }} options={{ animation: false, maintainAspectRatio: false, responsive: true, scales: { x: { ticks: { maxTicksLimit: 7 }, title: { display: true, text: 'Calendar date (missing days remain gaps)' } }, y: { min: 0, max: hours ? 24 : 10, title: { display: true, text: hours ? 'Hours' : 'Rating / 10' } } } }} /></div>
}
