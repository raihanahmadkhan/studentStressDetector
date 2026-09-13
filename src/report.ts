import type { CheckIn } from './types'

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** A standalone, script-free report from one consistent account export. */
export function visualReport(source: string): string {
  const data = JSON.parse(source) as { revisions: CheckIn[] }
  if (!Array.isArray(data.revisions)) throw new Error('Invalid export')
  const latest = new Map<string, CheckIn>()
  for (const row of data.revisions) {
    if (!row || typeof row.observation_date !== 'string' || !Number.isInteger(row.revision) || !row.inputs || !row.assessment) throw new Error('Invalid observation')
    if (!latest.has(row.id) || latest.get(row.id)!.revision < row.revision) latest.set(row.id, row)
  }
  const rows = [...latest.values()].sort((a, b) => a.observation_date.localeCompare(b.observation_date))
  const number = (n: unknown, max: number): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max
  const score = (row: CheckIn) => row.assessment.status === 'ok' && number(row.assessment.score, 100) ? row.assessment.score : null
  const chart = (label: string, max: number, get: (row: CheckIn) => number | null) => {
    const start = Date.parse(rows[0]?.observation_date ?? '')
    const end = Date.parse(rows.at(-1)?.observation_date ?? '')
    const x = (row: CheckIn) => rows.length === 1 ? 400 : 45 + (Date.parse(row.observation_date) - start) / Math.max(86400000, end - start) * 710
    const color = max === 100 ? '#1b624f' : '#6275a4'
    const gradient = `area-${max}`
    const points = rows.flatMap(row => {
      const value = get(row)
      return number(value, max) ? [{ row, value, x: x(row), y: 190 - value / max * 160 }] : []
    })
    const segments = points.slice(1).map((point, i) => {
      const previous = points[i]
      const gap = Date.parse(point.row.observation_date) - Date.parse(previous.row.observation_date) > 86400000
      return `${gap ? '' : `<path d="M${previous.x},190 L${previous.x},${previous.y} L${point.x},${point.y} L${point.x},190 Z" fill="url(#${gradient})"/>`}<path class="trend-line" d="M${previous.x},${previous.y} L${point.x},${point.y}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ${gap ? 'stroke-dasharray="5 5" opacity="0.6"' : ''}/>`
    }).join('')
    const dots = points.map(point => `<circle cx="${point.x}" cy="${point.y}" r="4.5" fill="${color}" stroke="white" stroke-width="2"><title>${escape(point.row.observation_date)}: ${point.value}</title></circle>`).join('')
    return `<section><h2>${label}</h2><p>Each point is a saved day. Dashed connections span missing days; they do not estimate unrecorded values.</p>${dots ? `<svg viewBox="0 0 800 240" role="img" aria-label="${label}. Connected recorded values; dashed lines span missing days. Exact values appear in the table below."><defs><linearGradient id="${gradient}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.16"/><stop offset="100%" stop-color="${color}" stop-opacity="0.02"/></linearGradient></defs>${[0, max / 4, max / 2, max * .75, max].map(t => `<line x1="45" x2="755" y1="${190 - t / max * 160}" y2="${190 - t / max * 160}" stroke="#e4ebe6" stroke-dasharray="3 5"/><text x="5" y="${195 - t / max * 160}">${t}</text>`).join('')}${segments}${dots}<text x="45" y="225">${escape(rows[0]?.observation_date)}</text><text x="755" y="225" text-anchor="end">${escape(rows.at(-1)?.observation_date)}</text></svg>` : '<p>No recorded values available.</p>'}</section>`
  }
  const versions = new Set(rows.map(row => row.assessment.model_version))
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Your stress report</title><style>body{font:16px/1.6 system-ui,sans-serif;color:#173e39;background:#f5f7f1;margin:auto;padding:32px;max-width:1050px}h1{font-size:2.4rem}section{background:white;border:1px solid #dce5d9;border-radius:16px;padding:24px;margin:24px 0}svg{width:100%;height:auto}text{font-size:13px;fill:#34534c}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:10px;border-bottom:1px solid #ddd}.table{overflow:auto}small{display:block} @media print{body{background:white;padding:0}section{break-inside:avoid}thead{display:table-header-group}}@media(max-width:600px){body{padding:16px}section{padding:14px}}</style></head><body><header><p>Student Stress Detector</p><h1>Your stress report</h1><p>${rows.length} saved ${rows.length === 1 ? 'day' : 'days'}${rows.length ? ` · ${escape(rows[0].observation_date)} to ${escape(rows.at(-1)!.observation_date)}` : ''}</p><p>Latest saved values for each day. Open this file in a browser to view it, or use Print → Save as PDF.</p></header>${rows.length ? `${chart('Estimated stress · out of 100', 100, score)}${versions.size > 1 ? '<p>The calculation changed during this period. Scores from different calculation methods may not be directly comparable.</p>' : ''}${chart('Your reported strain · out of 10', 10, row => row.inputs.reported_strain)}<section><h2>Your check-ins</h2><div class="table"><table><caption>Daily values and original stress estimates. Unrecorded values appear as —.</caption><thead><tr>${['Date / timezone', 'Stress /100', 'Strain /10', 'Sleep (h)', 'Workload /10', 'Deadlines /10', 'Screen (h)', 'Commitments /10', 'Recovery /10'].map(t => `<th scope="col">${t}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr><td>${escape(row.observation_date)}<small>${escape(row.timezone)}</small></td>${[score(row), row.inputs.reported_strain, row.inputs.sleep_hours, row.inputs.academic_load, row.inputs.deadline_pressure, row.inputs.screen_hours, row.inputs.extracurricular_load, row.inputs.recovery].map(v => `<td>${escape(v ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>` : '<section><h2>No check-ins yet</h2><p>Save a check-in to start your stress report.</p></section>'}<footer><p>This report contains personal data. Share it only with people you choose.</p><p>Stress estimates use authored rules and are not a clinical diagnosis. Reported strain is your own separate observation.</p></footer></body></html>`
}
