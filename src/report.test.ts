import { expect, it } from 'vitest'
import { visualReport } from './report'

const row = (revision: number, score: number | null) => ({ id: 'one', observation_date: '2026-09-12', revision, timezone: 'UTC', inputs: { reported_strain: 0, sleep_hours: 7 }, assessment: { status: 'ok', score, model_version: 'internal-version' } })

it('connects consecutive points and marks gaps without filling missing days', () => {
  const revisions = [row(1, 20), { ...row(1, 40), id: 'two', observation_date: '2026-09-13' }, { ...row(1, 60), id: 'three', observation_date: '2026-09-16' }]
  const doc = new DOMParser().parseFromString(visualReport(JSON.stringify({ revisions })), 'text/html')
  const chart = doc.querySelector('svg')!
  expect(chart.querySelectorAll('circle')).toHaveLength(3)
  expect(chart.querySelectorAll('.trend-line')).toHaveLength(2)
  expect(chart.querySelectorAll('.trend-line[stroke-dasharray]')).toHaveLength(1)
  expect(chart.querySelectorAll('path[fill^="url"]')).toHaveLength(1)
})

it('exports only the latest revision and keeps strain zero distinct from missing values', () => {
  const html = visualReport(JSON.stringify({ revisions: [row(2, 60), row(1, 20)] }))
  const doc = new DOMParser().parseFromString(html, 'text/html')
  expect(doc.querySelectorAll('tbody tr')).toHaveLength(1)
  expect(doc.querySelector('tbody')?.textContent).toContain('60')
  expect(doc.querySelector('tbody')?.textContent).not.toContain('20UTC')
  expect(doc.querySelectorAll('circle')).toHaveLength(2)
  expect(doc.querySelectorAll('circle')[1].querySelector('title')?.textContent).toContain(': 0')
  expect(html).not.toContain('internal-version')
})

it('escapes exported content and includes no executable or remote dependencies', () => {
  const html = visualReport(JSON.stringify({ revisions: [{ ...row(1, 30), timezone: '<script>alert(1)</script>' }] }))
  const doc = new DOMParser().parseFromString(html, 'text/html')
  expect(doc.querySelector('script')).toBeNull()
  expect(doc.querySelector('[src]')).toBeNull()
  expect(doc.querySelector('tbody')?.textContent).toContain('<script>alert(1)</script>')
})

it('handles empty history and unavailable scores without inventing zero stress', () => {
  expect(visualReport('{"revisions":[]}')).toContain('No check-ins yet')
  const doc = new DOMParser().parseFromString(visualReport(JSON.stringify({ revisions: [row(1, null)] })), 'text/html')
  expect(doc.querySelectorAll('circle')).toHaveLength(1)
  expect(doc.querySelector('tbody')?.textContent).toContain('—')
  expect(() => visualReport('{}')).toThrow('Invalid export')
})
